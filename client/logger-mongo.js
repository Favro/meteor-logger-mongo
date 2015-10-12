let computation, observer, subscription;

Logger.enable = function enable(options = {}) {
	check(options, optionsPattern);

	_.defaults(options, { from: new Date() }, defaultOptions);

	let { actions, collection, } = options;
	const { auth, from, showTag, tag, } = options;

	if (Match.test(collection, String)) {
		collection = {
			_name: collection,
		};
	}

	if (!Logs || Logs._name !== collection._name) {

		Logs = Mongo.Collection.get(collection._name);

		if (!Logs) {

			if (Match.test(collection, Mongo.Collection)) {
				Logs = collection;
			} else {
				Logs = new Mongo.Collection(collection._name);
			}
		}
	}

	if (Match.test(actions, String)) {
		actions = actions.split(/[\s,]+/g);
	}

	actions = _.intersection(actions, supportedActions);

	if (observer) {
		observer.stop();
	}

	if (computation) {
		computation.stop();
	}

	if (subscription) {
		subscription.stop();
	}

	subscription = Meteor.subscribe(collection._name, {
		actions,
		from,
		tag,
	});

	computation = Meteor.autorun(() => {
		if (subscription.ready()) {
			observer = Logs.find().observeChanges({
				added(id, fields) {
					const args = fields.data.map((arg) => {
						try {
							return EJSON.parse(arg);
						} catch (error) {
							if (error instanceof SyntaxError) {
								return arg;
							}
						}
					});
					if (showTag && fields.tag) {
						console[fields.type]('Server console:', fields.tag, ...args);
					} else {
						console[fields.type]('Server console:', ...args);
					}

				}
			});
		}
	});
}

Logger.disable = function disable() {
	observer.stop();
	subscription.stop();
	computation.stop();

	Logs = undefined;
}
