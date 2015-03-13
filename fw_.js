(function ($, _, routie, Handlebars) {
    'use strict';

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


