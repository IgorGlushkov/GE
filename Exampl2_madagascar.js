//Combine 3 last years cloud-free mosaic of Landsat 8 TOA Reflectance and GLAD data for whole Madagaskar

//SET AOI -using fusion table
var country = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');
var mask = country.filter(ee.Filter.eq('Country', 'Madagascar'));
print(mask);

//ADD layer on map
Map.centerObject(mask,6);
Map.addLayer(mask,{color: '808080'},'MADA');

//Get collection of LandsatTOA 8 images for 2014-2016 with apply FMASK
var filterL8TOA14 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
  .filterBounds(mask)
  .filterDate('2014-02-01', '2014-11-01')
  .map(function(img){
      var cloudMask = img.select('fmask').lt(2);
      return img.mask(img.mask().and(cloudMask));
})
  .map(function(img){
      return img.expression('b(3,4,5,6,7)*255');
})
  .map(function(img){
      return img.byte();
})
;

var filterL8TOA15 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
  .filterBounds(mask)
  .filterDate('2015-02-01', '2015-11-01')
  .map(function(img){
      var cloudMask = img.select('fmask').lt(2);
      return img.mask(img.mask().and(cloudMask));
})
  .map(function(img){
      return img.expression('b(3,4,5,6,7)*255');
})
  .map(function(img){
      return img.byte();
})
;
var filterL8TOA16 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA_FMASK')
  .filterBounds(mask)
  .filterDate('2016-02-01', '2016-11-01')
  .map(function(img){
      var cloudMask = img.select('fmask').lt(2);
      return img.mask(img.mask().and(cloudMask));
})
  .map(function(img){
      return img.expression('b(3,4,5,6,7)*255');
})
  .map(function(img){
      return img.byte();
})
;
 
//Print collection
print(filterL8TOA14,filterL8TOA15,filterL8TOA16)


//Get median value
var medianL8_2014 = filterL8TOA14.median();
var medianL8_2015 = filterL8TOA15.median();
var medianL8_2016 = filterL8TOA16.median();
//Clip
var clippedL8_2014 = medianL8_2014.clipToCollection(mask);
var clippedL8_2015 = medianL8_2015.clipToCollection(mask);
var clippedL8_2016 = medianL8_2016.clipToCollection(mask);


//ADD GLAD data (lOSS , FOREST COVER,LAST COMPOSYTE)
var lossyear = ee.Image('UMD/hansen/global_forest_change_2015').select(['lossyear']);
var treecover2000 = ee.Image('UMD/hansen/global_forest_change_2015').select(['treecover2000']);
var lastcomposyte = ee.Image('UMD/hansen/global_forest_change_2015').select(['last_b70','last_b50', 'last_b40', 'last_b30']);
var clipped_UMD2014 = lastcomposyte.clipToCollection(mask);
//clip
var clippedLOSS = lossyear.clipToCollection(mask);
var clippedCOVER2000 = treecover2000.clipToCollection(mask);

//Add to map
Map.addLayer(clipped_UMD2014,{bands: 'last_b50,last_b40,last_b30',max:['128','128','128'],gamma:1.6},'UMD_2014-last_composyte');
Map.addLayer(clippedL8_2014,{bands: 'B6,B5,B4',max:['128','128','128'],gamma:1.6},'L8TOA_2014-summer_median');
Map.addLayer(clippedL8_2015,{bands: 'B6,B5,B4',max:['128','128','128'],gamma:1.6},'L8TOA_2015-summer_median');
Map.addLayer(clippedL8_2016,{bands: 'B6,B5,B4',max:['80','128','80'],gamma:1.6},'L8TOA_2016-summer_median');
Map.addLayer(clippedCOVER2000, {bands: 'treecover2000', min: [1], max: [100],palette:['yellow', 'green']},'TREECOVER_GLAD_2000');
Map.addLayer(clippedLOSS.updateMask(clippedLOSS), {bands: 'lossyear', min: [1], max: [14],palette:['blue', 'red']},'LOSS_GLAD');

//EXPORT
//export
Export.image.toDrive({
    image:clippedL8_2014,
    description: 'L8_2014',
    scale: 30,
    maxPixels: 50000000000
  })
;
//export
Export.image.toDrive({
    image: clippedL8_2015,
    description: 'L8_2015',
    scale: 30,
    maxPixels: 50000000000
  })
;

Export.image.toDrive({
    image: clippedL8_2016,
    description: 'L8_2016',
    scale: 30,
    maxPixels: 50000000000
  })
;
Export.image.toDrive({
    image: clippedCOVER2000,
    description: 'COVER2000',
    scale: 30,
    maxPixels: 50000000000
  })
;
Export.image.toDrive({
    image: clipped_UMD2014,
    description: 'UMD2014',
    scale: 30,
    maxPixels: 50000000000
  })
;
Export.image.toDrive({
    image: clippedLOSS,
    description: 'LOSS',
    scale: 30,
    maxPixels: 50000000000
  })
;

//export aoi
Export.table.toDrive({
  collection: mask,
  description:'aoi',
  fileFormat: 'KML'
});
