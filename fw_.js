(function ($, _, routie, Handlebars) {
    'use strict';

    function formatDecimal(amount, decimals, decimalSeparator, thousandSeparator) {
        var
            c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals,
            d = decimalSeparator === undefined ? "," : decimalSeparator,
            t = thousandSeparator === undefined ? " " : thousandSeparator,
            s = amount < 0 ? "-" : "",
            i = parseInt(amount = Math.abs(+amount || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;

        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
            (c ? d + Math.abs(amount - i).toFixed(c).slice(2) : "");
    }

    window.fw_ = function () {
        var storage = {},
            application = this;

        function set(category, name, value) {
            if (!storage[category]) {
                storage[category] = {};
            }
            storage[category][name] = value;
        }

        function get(category, name) {
            if (!storage[category]) {
                storage[category] = {};
            }
            return storage[category][name];
        }

        function getSetGeneric(category, name, value) {
            var count = arguments.length;
            if (count === 2) {
                return get(category, name);
            }
            else if (count === 3) {
                set(category, name, value);
                return this;
            }
            else {
                throw {message: 'Incorrect number of arguments'};
            }
        }

        this.template = _.bind(getSetGeneric, this, 'template');
        this.state = _.bind(getSetGeneric, this, 'state');
        this.controller = _.bind(getSetGeneric, this, 'controller');
        this.route = _.bind(getSetGeneric, this, 'route');
        this.resource = _.bind(getSetGeneric, this, 'resource');
        this.render = function (template, data) {
            application.emit('appBeforeRender');
            $('[data-fv-view]').html(template(data));
            application.emit('appAfterRender');
        };
        this.start = function () {
            var routes;
            application.emit('appBeforeInit', application);

            /* Compiling templates */
            $('script[type="text/x-handlebars"]').each(function () {
                var
                    $this = $(this),
                    id = $this.attr('id') || '',
                    body = $this.html();
                application.template(id, Handlebars.compile(body));
            });

            /* Registering partials */
            $('script[type="partial/x-handlebars"]').each(function () {
                var
                    $this = $(this),
                    id = $this.attr('id') || '',
                    body = $this.html();
                Handlebars.registerPartial(id, body);
            });

            Handlebars.registerHelper('route', function (url) {
                return new Handlebars.SafeString('#' + routie.lookup(url));
            });

            Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

                switch (operator) {
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            });

            Handlebars.registerHelper('decimal', function(number, decimals, decimalSeparator, thousandSeparator){
                return formatDecimal(number, decimals, decimalSeparator, thousandSeparator);
            });

            routes = _.chain(storage['route'])
                .map(function (controller, path) {
                    return [path, function () {
                        var resources = [];
                        if (application.resource('')) {
                            resources.push(application.resource('')(application));
                        }
                        if (application.resource(controller)) {
                            resources.push(application.resource(controller)(application));
                        }
                        application.emit('beforeResources', application);

                        $.when.apply(this, resources).then(function () {
                            application.emit('afterResources', application);
                            storage['controller'][controller].apply(application, arguments);
                        }).fail(function (error) {
                            alert('Wystąpił błąd podczas komunkacji z serwerem');
                        });
                    }];
                })
                .object()
                .value();

            application.emit('appAfterInit', application);
            routes['*'] = function () {
                routie(routie.lookup('index'));
            };
            routie(routes);
        };

    };
})(jQuery, _, routie, Handlebars);


