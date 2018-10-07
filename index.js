const request = require('./request')

class Transmission {

	options: {},

	csrfToken: '',

	constructor(options = {}) {
		this.options = options
		this.options.auth = options.user + ':' + options.password
	}

	getTorrents() {
		const params = {
			"fields": [
				"id", "name", "totalSize", "isFinished", "status",
				"startDate", "doneDate", "activityDate",
				"percentDone", "leftUntilDone"
			]
		}

		return this.request('torrent-get', params).then(resp => resp.torrents)
	}

	getTorrent(id) {
		const params = {
			"fields": [
				"id", "name", "error", "errorString",
				"totalSize", "leftUntilDone", "percentDone",
				"status", "isFinished", 
				"rateDownload", "secondsDownloading"
			],
			"ids": [id]
		}

		return this.request('torrent-get', params).then((resp) => {
			let torrent = resp.torrents[0]

			if (torrent) {
				const percentDone = torrent.percentDone * 100
				torrent.percentDone = percentDone.toFixed(1)

				const rateDownloadKBs = torrent.rateDownload / 1000
				const rateDownloadMBs = rateDownloadKBs / 1000

				if (rateDownloadMBs > 1) {
					torrent.downloadSpeed = rateDownloadMBs.toFixed(2) + ' MB/s'
				} else {
					torrent.downloadSpeed = rateDownloadKBs.toFixed(2) + ' KB/s'
				}

				const secondsLeftUntilDone = torrent.leftUntilDone / torrent.rateDownload
				torrent.secondsRemain = secondsLeftUntilDone
			}

			return torrent
		})
	}

	addTorrent(url, options = {}) {
		const params = Object.assign(options, {
			"filename": url
		})

		return this.request('torrent-add', params).then((resp) => {
			return response['torrent-added'] || response['torrent-duplicate'] || null
		})
	}

    startTorrent: function(id) {
    	const params = {
    		"ids": [id]
    	}

        return this.request('torrent-start', params)
    }

    startTorrentNow: function(id) {
    	const params = {
    		"ids": [id]
    	}

        return this.request('torrent-start-now', params)
    }

    stopTorrent: function(id) {
    	const params = {
    		"ids": [id]
    	}

        return this.request('torrent-stop', params)
    }

	removeTorrent: function(id) {
		const params = {
			"ids": [id]
		}

		return this.request('torrent-remove', params)
	}

	request: function(method, params) {
		const self = this

		const options = {
			hostname: self.options.host,
			port: self.options.port,
			path: self.options.path,
			auth: self.options.auth,

			method: 'POST',
			
			headers: {
				'X-Transmission-Session-Id': self.csrfToken,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}

		const payload = JSON.stringify({
			"arguments": params,
			"method": method
		})

		return request.post(options, payload).then((res) => {
			if (res.response.statusCode === 409) {
				self.csrfToken = res.response.headers['x-transmission-session-id']
				return self.request(method, params)
			}

			var data = JSON.parse(res.data)

			if (data.result === 'success') {
				return data.arguments
			}
		})
	}

}

module.exports = Transmission
