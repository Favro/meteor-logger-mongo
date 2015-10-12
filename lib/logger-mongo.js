defaultOptions = {
	auth() {
		return true;
	},
	actions: ['error', 'info', 'log', 'warn'],
	collection: 'hansoft.logger.logs',
	cappedCollection: true,
	cappedCollectionByteSize: 1048576,
	cappedCollectionMaxDocuments: 1000,
	showTag: true,
};

Logs = undefined;

optionsPattern = {
	actions: Match.Optional(Match.OneOf(String, [String])),
	auth: Match.Optional(Function),
	collection: Match.Optional(Match.OneOf(Mongo.Collection, String)),
	cappedCollection: Match.Optional(Boolean),
	cappedCollectionByteSize: Match.Optional(Number),
	cappedCollectionMaxDocuments: Match.Optional(Number),
	from: Match.Optional(Date),
	showTag: Match.Optional(Boolean),
	tag: Match.Optional(String),
};

supportedActions = ['error', 'info', 'log', 'warn'];

Logger = {
	config(options = {}) {
		_.extend(defaultOptions, options);
	},
	configure(...args) {
		this.config(...args);
	}
}
