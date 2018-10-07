var http = require('http');

module.exports.post = function(options, payload) {
	return new Promise(function(resolve, reject) {
		var request = http.request(options, function(response) {
			var result = ''

			response.on('data', function(data) {
				result += data;
			});

			response.on('end', function() {
				resolve({
					response: response, 
					data: result
				});
			})
		});

		request.write(payload);
		request.end();
	});
}