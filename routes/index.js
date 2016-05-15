var express = require('express');
var router = express.Router();

var request = require('request');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index');

});

router.get('/shipData', function (req, res, next) {
	var domain = 'http://www.portofhelsinki.fi/tavaraliikenne/saapuvat_alukset';
	request(domain, function(err, resp, html) {
		if (err) {
			console.error(err);
			return res.json({"status":"internal error"}, 500);
		}

		require("jsdom").env("", function (err, window) {
			if (err) {
				console.error(err);
				return res.json({"status":"internal error"}, 500);
			}

			var $ = require("jquery")(window);

			var tbody = $(html).find('a#lsatama').parent().next('table').find('tbody');

			var shipData = [];
			tbody.find('tr').each(function (index, value) {
				$(value).find('td').each(function (index, td) {
					var shipItem = {};
					$(td).find('span').each(function(index, value) {
						if ($(value).attr('id').indexOf('NimiLbl') >= 0) {
							shipItem.shipName = $(value).text();
						} else if ($(value).attr('id').indexOf('VarustamoLbl') >= 0) {
							shipItem.firmName = $(value).text();
						} else if ($(value).attr('id').indexOf('SaapuuLbl') >= 0) {
							shipItem.arrivalTime = $(value).text();
						}
					});
					if (shipItem.shipName || shipItem.firmName || shipItem.arrivalTime) {
						shipData.push(shipItem);
					}
				});
			});

			return res.json(shipData, 200);
		});
	});
});

module.exports = router;