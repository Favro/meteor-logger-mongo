const originalConsoleActions = {};

Logger.enable = function enable(options = {}) {
	check(options, optionsPattern);

	_.defaults(options, defaultOptions);

	let { actions, collection, } = options;
	const {
		auth,
		cappedCollection,
		cappedCollectionByteSize,
		cappedCollectionMaxDocuments,
		tag,
	} = options;

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
				if (cappedCollection) {
					Logs._createCappedCollection(
						cappedCollectionByteSize,
						cappedCollectionMaxDocuments
					);
				}
			}
		}
	}

	if (Match.test(actions, String)) {
		actions = actions.split(/[\s,]+/g);
	}

	supportedActions.forEach((action) => {
		if (originalConsoleActions[action]) {
			console[action] = originalConsoleActions[action];
		}
	});

	actions = _.intersection(actions, supportedActions);

	actions.forEach((action) => {
		if (!originalConsoleActions[action]) {
			originalConsoleActions[action] = console[action];
		}

		console[action] = function(...args) {
			originalConsoleActions[action].apply(console, args);

			args = args.map((arg) => {
				if (!Match.test(arg, String)) {
					try {
						return EJSON.stringify(arg);
					} catch (error) {
						return `Object has circular references. Object was ignored.`;
					}
				} else {
					return arg;
				}
			});

			let log = {
				date: new Date(),
				data: args,
				type: action,
			};

			if (tag) {
				log.tag = tag;
			}

			Logs.insert(log, (error, result) => {
				if (error) {
					originalConsoleActions.error.call(console, error);
				}
			});
		};
	});

	const publishHandlers = _.keys(Meteor.default_server.publish_handlers);

	if (_.contains(publishHandlers, collection._name)) {
		return;
	}

	Meteor.publish(collection._name, function(options = {}) {
		check(options, {
			actions: Match.Optional([String]),
			from: Match.Optional(Date),
			tag: Match.Optional(String),
		});

		const { from, actions, tag } = _.defaults(options, {
			from: new Date(),
			actions: supportedActions,
		});

		let allow = true;

		if (!Package['insecure']) {
			allow = auth.apply(this);
		}

		if (allow) {
			return Logs.find({
				date: {
					$gte: from,
				},
				tag,
				type: {
					$in: actions,
				},
			});
		} else {
			this.ready();
		}
	});
}

Logger.disable = function disable(actions = defaultOptions.actions) {
	check(actions, optionsPattern.actions);

	actions = _.intersection(actions, supportedActions);

	actions.forEach((action) => {
		if (console[action]) {
			console[action] = originalConsoleActions[action];
		}
	});

	Logs = undefined;
}
