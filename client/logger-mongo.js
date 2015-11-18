let computation, observer, subscription;

Logger.enable = function enable(options = {}) {
	check(options, optionsPattern);

	_.defaults(options, { from: new Date() }, defaultOptions);

	let { actions, collection, } = options;
	const { from, showTag, tag, } = options;

	if (Match.test(collection, String)) {
		collection = {
			_name: collection,
		};
	}

	this.disable();

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

	subscription = Meteor.subscribe('hansoft.logger.logs', {
		actions,
		from,
		tag,
	});

	// Don't observe until subscription's ready. This prevents old data being
	// logged when running enable with new options.
	// Client cache isn't cleared before new observer is set up if we don't wait
	// for subscription to be ready, resulting in logging old data.
	computation = Meteor.autorun(() => {
		if (subscription.ready()) {
			const selector = {
				date: {
					$gte: from,
				},
				type: {
					$in: actions,
				},
			};

			if (tag) {
				selector.tag = tag;
			}

			observer = Logs.find(selector, {
				sort: {
					date: 1,
				},
			}).observeChanges({
				added(id, fields) {
					if (showTag && fields.tag) {
						console[fields.type](`Server console (${fields.tag}):`, ...fields.data);
					} else {
						console[fields.type]('Server console:', ...fields.data);
					}
				},
			});
		}
	});
}

Logger.disable = function disable() {
	if (observer) {
		observer.stop();
		observer = undefined;
	}

	if (subscription) {
		subscription.stop();
		subscription = undefined;
	}

	if (computation) {
		computation.stop();
		computation = undefined;
	}
}
