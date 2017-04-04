// Set AOI using existing data sets
var AOI = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');
//Select Cambodia
var Cam = AOI.filter(ee.Filter.eq('Country', 'Cambodia'));
print(Cam)
//ADD layer on map
//Zoom to Cambodia
Map.centerObject(Cam);
Map.addLayer(Cam, {'color': 'FF0000'});

//Filetr collection using BQA band
var filterL8BQA_2017 = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterBounds(Cam)
  .filterDate('2017-02-01', '2017-03-14')
  .map(function(img){
      var cloudMask = img.select('BQA').lt(50000);
      return img.mask(img.mask().and(cloudMask));
})
;
//print collection
print(filterL8BQA_2017)

//Look at the collection
var vizParamsL8 = {'bands': 'B6,B5,B4',
                 'min': 3000,
                 'max': 30000,
                 'gamma': 1.6};
                 
//Zoom to image
//Map.centerObject(L8);
//Add collection to map
Map.addLayer(filterL8BQA_2017, vizParamsL8, 'l8 collection');

//Get median value
var medianL8BQA_2017 = filterL8BQA_2017.median();
//Clip to AOI
var clipped_medianL8BQA_2017 = medianL8BQA_2017.clipToCollection(Cam);
//Add to map

Map.addLayer(clipped_medianL8BQA_2017,{bands: 'B6,B5,B4', max: '30000',gamma:1.6},'L8BQA_2017_median');


//Repeat for S2
//S2 collection

//Filter collection using BQA60 band
var filterS2BQA60 = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(Cam)
  .filterDate('2016-02-01', '2016-04-01')
  .map(function(img){
      var cloudMask = img.select('QA60').lt(1024);
      return img.mask(img.mask().and(cloudMask));
})
; 
//print(filterS2BQA60)

//Get median value
var medianS2_2016 = filterS2BQA60.median();
//Clip to AOI
var clipped_medianS2_2016 = medianS2_2016.clipToCollection(Cam);
//Map.addLayer(clipped_medianS2_2016,{bands: 'B12,B8,B4', min:'200',max: '5000',gamma:1.6},'S2_2016_median');
//repeat for 2017
var filterS2BQA60_17 = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(Cam)
  .filterDate('2017-02-01', '2017-03-14')
  .map(function(img){
      var cloudMask = img.select('QA60').lt(1024);
      return img.mask(img.mask().and(cloudMask));
})
;
//print collection
print(filterS2BQA60_17)
//Look at the collection
var vizParamsS2 = {'bands': 'B12,B8,B4',
                 'min': 300,
                 'max': 5000,
                 'gamma': 1.6};
                 
//Add collection to map
Map.addLayer(filterS2BQA60_17, vizParamsS2, 'S2 collection');
//Get median value
var medianS2_2017 = filterS2BQA60_17.median();
//Clip to AOI
var clipped_medianS2_2017 = medianS2_2017.clipToCollection(Cam);
Map.addLayer(clipped_medianS2_2017,{bands: 'B12,B8,B4', min:'200',max: '5000',gamma:1.6},'S2_2017_median');

//Look at the separate first scene
//var S2first = ee.Image(filterS2BQA60_17.first());
//print(S2first)
//Set bands and histogramm
var vizParams = {'bands': 'B6,B5,B4',
                 'min': 3000,
                 'max': 15000,
                 'gamma': 1.6};
                 
//Zoom to image
//Map.centerObject(L8);
//Add image
//Map.addLayer(S2first, vizParams,'S2');
//var link=S2first.getDownloadURL({
  //'name':'20170203T032931_20170203T033420_T48PTA',
  //'scale': 10
//});
//print(link);

//export
Export.image.toDrive({
    image:clipped_medianL8BQA_2017,
    description: 'medianL8_2017',
    scale: 30,
    maxPixels: 50000000000
  })
;
//export
Export.image.toDrive({
    image: clipped_medianS2_2017,
    description: 'medianS2_2017',
    scale: 10,
    maxPixels: 50000000000
  })
;
