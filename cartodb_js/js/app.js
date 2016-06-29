// Generate HTML for infowindow
function loadFeatureStats(info, cartodb_id) {
    var sql = new cartodb.SQL({user: 'jorgeas80'});

    sql.execute("with table1 as (SELECT a.cartodb_id, count(c.cartodb_id) as n FROM distritos_madrid_distritos_madrid_con_carril_y_bm a left join gbicimad c on st_contains(a.the_geom, c.the_geom) group by(a.cartodb_id)), table2 as (select a.cartodb_id, sum(st_length(b.the_geom_webmercator)) as l from distritos_madrid_distritos_madrid_con_carril_y_bm a left join ciclocarriles_madrid b on st_contains(a.the_geom, b.the_geom) group by(a.cartodb_id)) select t1.cartodb_id, t1.n, t2.l from table1 t1, table2 t2 where t1.cartodb_id = t2.cartodb_id and t1.cartodb_id =" + cartodb_id).done(function(data) {

        if (data.rows) {
            info.update(data.rows);
        }

    }).error(function(errors) {
        // errors contains a list of errors
        console.log("errors:" + errors);
    });
}


function buildInfoWindowContent(data) {

    if (data == 'waiting') {
        return 'Cargando datos...';
    }

    var htmlDiv = "<div class='graph' style='right: 400px; top: 400px;'><div class='graph-inner'>";

    if (data && data.length > 0) {
        km = parseFloat(data[0].l) || 0;
        km = (km/1000).toFixed(2);
        stations = parseInt(data[0].n) || 0;

    }

    else {
        km = 0;
        stations = 0;
    }

    htmlDiv += "<span class='graph-provider'>" + km + " km</span>";

    htmlDiv += "<span class='graph-figure'>" + stations + " estaciones</span>";

    htmlDiv += "<span class='stations'>Estaciones BiciMad</span><span class='length'>Km totales ciclocarril</span></div></div>";

    return htmlDiv;
}

// Main function: create map and load cdb layers
function main() {
    // Load visualization
        var viz = cartodb.createVis('map', 'https://jorgeas80.cartodb.com/api/v2/viz/707b06ac-8ba8-11e5-bf74-0ea31932ec1d/viz.json', {
            shareable: false,
            search: false,
        })
            .done(function (vis, layers) {
                // To work with the native map
                var map = vis.getNativeMap();

                // Custom info window
                var info = L.control();

                info.onAdd = function (map) {
                    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
                    this.update();
                    return this._div;
                };

                // method that we will use to update the control based on feature properties passed
                info.update = function (data) {
                    this._div.innerHTML = '<h4>Estadísticas BiciMad</h4>' +  (data ?
                        buildInfoWindowContent(data)
                        : 'Pincha en un distrito para ver sus estadísticas');
                };

                info.addTo(map);


                // layer[1] is a layergroup containing the 3 sublayers (layer[0] is basemap)
                pol_layer = layers[1].getSubLayer(0);
                pol_layer.setInteraction(true);

                // Update the info window with polygon stats
                pol_layer.on('featureClick', function(e, pos, latlng, data) {
                    loadFeatureStats(info, data.cartodb_id)
                });

            }).on('error', function() {
                cartodb.log.log("some error occurred");
            });
}
