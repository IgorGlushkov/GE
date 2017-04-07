//Set AOI with drawing polygons. Use panel on the left side of map window
//Set aoi as permament feature collection (export enabled). 
//var aoi=new ee.FeatureCollection(geometry);

//Copy and paste polygons points from geometry to script body
var aoi=new ee.FeatureCollection(ee.Geometry.Polygon(
        [[[113.587646484375, 3.956907184148917],
          [111.2200927734375, 2.9260687192814694],
          [110.91796875, 1.7076061892244876],
          [116.78466796875, 1.6472072805392213],
          [116.69677734375, 3.9623872356507888],
          [113.6865234375, 3.9843070781054175]]]));

//Add to map
Map.addLayer(aoi,{color:'green'},'aoi_calimantan');

//Zoom to
Map.centerObject(aoi,8);
//Lets look on landsat8 collection for summer 2016
var L8_16 = ee.ImageCollection('LANDSAT/LC8_L1T')
   //set bounds
  .filterBounds(aoi)
  //set Date
  .filterDate('2016-03-01', '2016-10-30');
//print collection
print(L8_16);
//set visualisation parameters
var vizParamsL8 = {'bands': 'B6,B5,B4',
                 'min': 1000,
                 'max': 26000,
                 'gamma': 1.6};
//Add to map
Map.addLayer(L8_16, vizParamsL8, 'L8 collection');
//Now lets try remove clouds

//OPTION 1 Set "free-cloud" image collection using Landsat 8 with BQA dataset for summer 2016
var filterL8_16 = ee.ImageCollection('LANDSAT/LC8_L1T')
   //set bounds
  .filterBounds(aoi)
  //set Date
  .filterDate('2016-03-01', '2016-10-30')
  //functions for iterating thru images
  .map(function(img){
     //set cloud free mask (value less than 50000 is "free cloud" pixels)
      var cloudMask = img.select('BQA').lt(28000);
      //apply mask
      return img.mask(img.mask().and(cloudMask));
})
;
//print collection
print(filterL8_16);
//Add to map
Map.addLayer(filterL8_16, vizParamsL8, 'L8 collection "free-cloud"');
//ADD predefined simple mosaic algorythm and create mosaic
var mosaic_L8_16_composyte=ee.Algorithms.Landsat.simpleComposite(filterL8_16);
//Landsat.simpleComposite (LC) reduce image type to Byte and we need set new visualissation parameters
var vizParamsLC = {'bands': 'B6,B5,B4',
                 'min': 10,
                 'max': 128,
                 'gamma': 1.6};
//Add to map
//Map.addLayer(mosaic_L8_16_composyte, vizParamsLC, 'L8 composyte "free-cloud"');
//Clip to aoi
var clipped_L8_16_composyte=mosaic_L8_16_composyte.clipToCollection(aoi);
//Add to map
Map.addLayer(clipped_L8_16_composyte, vizParamsLC, 'L8 composyte "free-cloud"');
//OPTION 2   Set "free-cloud" image collection using Landsat 8 TOA with FMASK dataset for summer 2016
//more complex function, but result is better

var filterL8TOA16 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
   //set bounds
  .filterBounds(aoi)
  //set Date
  .filterDate('2016-03-01', '2016-10-30')
  //functions for iterating thru images
  .map(function(img){
     //set cloud free mask
      var cloudMask = img.select('fmask').lt(2);
      //apply mask
      return img.mask(img.mask().and(cloudMask));
})
  .map(function(img){
    //select only 4 bands and change reflectance (float 0-1) to 0-255 DN
      return img.expression('b("B6","B5","B4")*255');
})
  .map(function(img){
    //set data type (Byte - value from 0 to 255)
      return img.byte();
})
;
//Get median composyte
var medianL8TOA16=filterL8TOA16.median();
//Clip to aoi
var clipped_medianL8TOA16=medianL8TOA16.clipToCollection(aoi)
//Add to map using visual parameters same as Landsate comosyte
Map.addLayer(clipped_medianL8TOA16, vizParamsLC, 'L8TOA composyte "free-cloud"');


//Make Sentinel 2 collection for same date range
//COPERNICUS/S2
var S2_collection = ee.ImageCollection('COPERNICUS/S2')
  //set bounds
  .filterBounds(aoi)
  //set Date
  .filterDate('2016-03-01', '2016-10-30');

//Set bands and visualisation settings
var vizParamsS2 = {'bands': 'B11,B8,B3',
                 'min': 300,
                 'max': 5000,
                 'gamma': 1.6};
//Add collection to map
Map.addLayer(S2_collection, vizParamsS2, 'S2 collection');

//Set BQA band filter to select only cloud-free pixels
var S2_collection_cloudfree = ee.ImageCollection('COPERNICUS/S2')
  //set bounds
  .filterBounds(aoi)
  //set Date
  .filterDate('2016-03-01', '2016-10-30')
  //add simple cloud coverage filter
  //.filterMetadata('CLOUDY_PIXEL_PERCENTAGE','less_than', 50)
  .map(function(img){
      var cloudMask = img.select('QA60').eq(0);
      return img.mask(img.mask().and(cloudMask));
})
  .map(function(img){
    //select only 3 bands 
      return img.select("B11","B8","B3");
});

//Add collection to map and compare

//print collection 
print(S2_collection);

//Set median composyte
var medianS2=S2_collection_cloudfree.median();
//Clip by aoi
var clippedS2=medianS2.clipToCollection(aoi);

//Add collection to map and compare
Map.addLayer(clippedS2, vizParamsS2, 'S2 collection cloud-free');

//Look at selected image from collection Sentinel-2
var S2_20160308 = ee.Image('COPERNICUS/S2/20160308T030529_20160308T113955_T49NDB')
Map.addLayer(S2_20160308, vizParamsS2, 'S2_20160308');
//Look at selected image from collection Landsat 8 
var L8_20160308 = ee.Image('LANDSAT/LC8_L1T/LC81170572016083LGN00')
Map.addLayer(L8_20160308, vizParamsL8, 'L8_20160308');

//Export for one image via download url
var dwld=S2_20160308.getDownloadURL({
  'scale': 30,
  'crs': 'EPSG:4326',
});
print(dwld);

//Export mosaics (or image) to Google Drive
//export Sentinel
Export.image.toDrive({
    image:clippedS2,
    description: 'clippedS2',
    scale: 10,
    maxPixels: 50000000000
  })
;
//export Landsat
Export.image.toDrive({
    image: clipped_L8_16_composyte,
    description: 'clipped_L8_2016_composyte',
    scale: 30,
    maxPixels: 50000000000
  })
;
//Export AOI
Export.table.toDrive({
  collection: aoi,
  description:'AOI',
  fileFormat: 'KML'
});
