Package.describe({
	documentation: 'README.md',
	git: 'https://github.com/hansoft/meteor-logger-mongo.git',
	name: 'hansoft:logger-mongo',
	summary: 'Store console.<log/warn/error> in mongodb.',
  version: '1.0.0',
});

Package.onUse(function(api) {
  api.versionsFrom('1.2');

  api.use([
		'check',
		'ecmascript',
		'mongo',
		'underscore',
	]);

	api.use([
		'dburles:mongo-collection-instances',
	]);

	api.use('insecure', ['client', 'server'], { weak: true });

	api.addFiles('lib/logger-mongo.js');
	api.addFiles('server/logger-mongo.js', 'server');
	api.addFiles('client/logger-mongo.js', 'client');

	api.export('Logger');
});
