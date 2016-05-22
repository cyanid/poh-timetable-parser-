var express = require('express');
var router = express.Router();

var request = require('request');

var NodeCache = require( "node-cache" );
var myCache = new NodeCache( { stdTTL: 300, checkperiod: 120 } );


router.get('/', function (req, res, next) {
	res.render('index');

});

var fetchShipData = function(domain, res) {
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

			myCache.set( "shipData", shipData, function( err, success ){
				if( !err && success ){
					//console.log('ship data saved to cache');
				} else if (err) {
					console.error(err);
				}
			});

			return res.status(200).json(shipData);
		});
	});
};

var fetchShipDataHistory = function(domain, res) {
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

			var shipData = [];

			var tbody = $(html).find('h2').each(function (index, value) {
				//console.log($(value).text());
				if ($(value).text().indexOf('ja Hernesaari') >= 0) {
					//console.log('found port!');
					var table  = $(value).next('table').find('tbody').find('tr').each(function (index, value) {
						var shipItem = {};
						$(value).find('td').each(function (index, td) {
							//console.log($(td).text());

							$(td).find('span').each(function(index, value) {
								if ($(value).attr('id').indexOf('NimiLbl') >= 0) {
									shipItem.shipName = $(value).text();
								} else if ($(value).attr('id').indexOf('VarustamoLbl') >= 0) {
									shipItem.firmName = $(value).text();
								} else if ($(value).attr('id').indexOf('SaapuiLbl') >= 0) {
									shipItem.arrivalTime = $(value).text();
								}
							});
							if (shipItem.shipName || shipItem.firmName || shipItem.arrivalTime) {
								shipData.push(shipItem);
							}
						});
					});
				}
			});

			myCache.set("shipDataHistory", shipData, function( err, success ){
				if( !err && success ){
					//console.log('ship data saved to cache');
				} else if (err) {
					console.error(err);
				}
			});

			return res.status(200).json(shipData);
		});
	});
};

router.get('/shipData', function (req, res, next) {
	var domain = 'http://www.portofhelsinki.fi/tavaraliikenne/saapuvat_alukset';

	myCache.get( "shipData", function( err, value ){
		if( !err ){
			if(value == undefined){
				fetchShipData(domain, res);
			}else{
				//console.log('cache hit!');

				return res.status(200).json(value);
			}
		}
	});
});

router.get('/shipDataHistory', function (req, res, next) {
	var domainHistory = 'http://www.portofhelsinki.fi/tavaraliikenne/viiden_edellisen_paivan_liikenne';

	myCache.get( "shipDataHistory", function( err, value ){
		if( !err ){
			if(value == undefined){
				fetchShipDataHistory(domainHistory, res);
			}else{
				//console.log('cache hit!');

				return res.status(200).json(value);
			}
		}
	});
});

router.get('/webhook', function (req, res) {
	if (req.query['hub.verify_token'] === 'vihis666') {
		return res.status(200).json((parseInt(req.query['hub.challenge'])));
	}
	return res.status(403).json({"status":"wrong code"});
});

module.exports = router;