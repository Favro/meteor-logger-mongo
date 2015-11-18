const originalConsoleActions = {};
let auth;
let publicationAlreadySetUp = false;
let Fiber = Npm.require('fibers');

function setupPublication() {
	if (publicationAlreadySetUp) {
		return;
	}

	Meteor.publish('hansoft.logger.logs', function(options = {}) {
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

		if (!allow) {
			this.error(new Meteor.Error(403, 'Access Denied.'));
			return;
		}

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

		return Logs.find(selector);
	});

	publicationAlreadySetUp = true;
}

Logger.enable = function enable(options = {}) {
	check(options, optionsPattern);

	_.defaults(options, defaultOptions);

	auth = options.auth;
	let { actions, collection, } = options;
	const {
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

	this.disable();

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

	actions = _.intersection(actions, supportedActions);

	actions.forEach((action) => {
		if (!originalConsoleActions[action]) {
			originalConsoleActions[action] = console[action];
		}

		console[action] = function(...args) {
			function applyAction() {
				originalConsoleActions[action].apply(console, args);

				let log = {
					date: new Date(),
					data: args,
					type: action,
				};

				if (tag) {
					log.tag = tag;
				}

				Logs.insert(log, (error, result) => {
					if (error instanceof RangeError) {
						log.data = 'Object has circular references. Object was ignored.';
						Logs.insert(log, (error, result) => {
							if(error) {
								originalConsoleActions.error.call(console, error);
							}
						});
					} else if (error) {
						originalConsoleActions.error.call(console, error);
					}
				});
			}

			if (Fiber.current) {
				applyAction();
			} else {
				Fiber(applyAction).run();
			}
		};
	});

	setupPublication();
}

Logger.disable = function disable() {
	supportedActions.forEach((action) => {
		if (originalConsoleActions[action]) {
			console[action] = originalConsoleActions[action];
		}
	});
}
