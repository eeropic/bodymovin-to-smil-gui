(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
bodymovinToSmil=require('bodymovin-to-smil')
},{"bodymovin-to-smil":7}],2:[function(require,module,exports){
(function (process){
var long_config = {
	naming: 'long',
	xml_formatted: true
}

var short_config = {
	naming: 'short',
	xml_formatted: false
}

var config;
if(process.env.ENVIRONMENT === 'DEV') {
	config = long_config;
} else {
	config = short_config;
}

module.exports = config
}).call(this,require('_process'))
},{"_process":36}],3:[function(require,module,exports){
var fontFamilies = []

function addFont(fontData) {
	fontFamilies.push(fontData);
}

function addFonts(fontList) {
    var i, len = fontList.length;
    for(i = 0; i < len; i += 1) {
    	addFont(fontList[i]);
    }
}

function getFontDataByName(name) {
	var i = 0, len = fontFamilies.length;
	while(i < len) {
		if(fontFamilies[i].fName === name) {
			return fontFamilies[i];
		}
	}
	return {
		fFamily: '',
		fStyle: ''
	}
}

function getFontFamily(name) {
	var fontData = getFontDataByName(name);
	return fontData.fFamily;
}

function getFontWeight(name) {
	var fontData = getFontDataByName(name);
	return fontData.fStyle;
}

module.exports = {
	addFonts: addFonts,
	addFont: addFont,
	getFontFamily: getFontFamily,
	getFontWeight: getFontWeight
}
},{}],4:[function(require,module,exports){
function componentToHex(c) {
	c = Math.round(c);
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

module.exports = rgbToHex
},{}],5:[function(require,module,exports){
var _inPoint = 0, _outPoint = 0, _frameRate = 1

function setTime(inPoint, outPoint, frameRate){
	_inPoint = _inPoint;
	_outPoint = outPoint;
	_frameRate = frameRate;

}

function getDuration(unit){
	switch(unit){
		case 'frames':
		return _outPoint - _inPoint;
		case 's':
		return (_outPoint - _inPoint) / _frameRate;
		case 'ms':
		return 1000 * (_outPoint - _inPoint) / _frameRate;
	}
}

module.exports = {
	setTime: setTime,
	getDuration: getDuration
}
},{}],6:[function(require,module,exports){
var node = require('../../node');
var property = require('../../property');
var targets = require('../../targets/targets');
var naming = require('../../naming');

function isPositionAnimated(positionProperty) {
	return isPositionXAnimated(positionProperty) || isPositionYAnimated(positionProperty);
}

function isPositionXAnimated(positionProperty) {
	if(positionProperty.s && positionProperty.x.a === 0) {
		return false;
	} else if(!positionProperty.s && positionProperty.a === 0) {
		return false;
	}
	return true;
}

function isPositionYAnimated(positionProperty) {
	if(positionProperty.s && positionProperty.y.a === 0) {
		return false;
	} else if(!positionProperty.s && positionProperty.a === 0) {
		return false;
	}
	return true;
}

function getPositionX(positionProperty) {
	if(positionProperty.s) {
		return positionProperty.x.k;	
	} else {
		return positionProperty.k[0];
	}
}

function getPositionY(positionProperty) {
	if(positionProperty.s) {
		return positionProperty.y.k;	
	} else {
		return positionProperty.k[1];
	}
}

function createTransformGroup(name, transform, timeOffset, _container) {
	var changed = false;
	var nodes =[];
	var currentName = name;
	var container, transformChain = '';
	var positionX, positionY;
	var animatedProperty;

	if(_container) {
		container = _container;
	} else {
		currentName = name + naming.TRANSFORM_NAME + '_' + + nodes.length;
		container = node.createNode('g', currentName);
	}
	nodes.push(container);

	function addToTransform( value) {
		transformChain +=  ' ' + value;
		node.addAttribute(container,'transform', transformChain);
		return container;
	}
	var hasAnimation = false;
	var needsTransform = true;

	if (!isPositionAnimated(transform.p) && transform.a.a === 0 && transform.r.a === 0 && transform.s.a === 0) {
		positionX = getPositionX(transform.p);
		positionY = getPositionY(transform.p);
		if(positionX - transform.a.k[0] === 0 && positionY - transform.a.k[1] === 0) {
			needsTransform = false;
		}
	}
	
	if (needsTransform) {
		if (isPositionAnimated(transform.p)) {
				hasAnimation = true;
				animatedProperty = property.createAnimatedProperty(currentName, 'position', transform.p.k, timeOffset);
				targets.addTarget(animatedProperty);
		} else {
			addToTransform('translate(' + transform.p.k[0] + ', ' + transform.p.k[1] + ')');
		}
	}
	if (hasAnimation) {
		if (transform.r.a === 1) {
			animatedProperty = property.createAnimatedProperty(currentName, 'rotate', transform.r.k, timeOffset);
		targets.addTarget(animatedProperty);
		} else if(transform.r.k !== 0){
			animatedProperty = property.createAnimatedPropertyFromStaticValue(currentName, 'rotate', transform.r.k, timeOffset);
			targets.addTarget(animatedProperty);
		}
	} else if (transform.r.a === 1) {
		hasAnimation = true;
		animatedProperty = property.createAnimatedProperty(currentName, 'rotate', transform.r.k, timeOffset);
		targets.addTarget(animatedProperty);
	} else if(transform.r.k !== 0){
		addToTransform('rotate(' + transform.r.k + ')');
	}

	if (hasAnimation) {
		if (transform.s.a === 1) {
			animatedProperty = property.createAnimatedProperty(currentName, 'scale', transform.s.k, timeOffset);
			targets.addTarget(animatedProperty);
		} else if (transform.s.k[0] !== 100 || transform.s.k[1] !== 100) {
			animatedProperty = property.createAnimatedPropertyFromStaticValue(currentName, 'scale', transform.s.k, timeOffset);
			targets.addTarget(animatedProperty);
		}
	} else if (transform.s.a === 1) {
		hasAnimation = true;
		animatedProperty = property.createAnimatedProperty(currentName, 'scale', transform.s.k, timeOffset);
		targets.addTarget(animatedProperty);
	} else if(transform.s.k[0] !== 100 || transform.s.k[1] !== 100){
		addToTransform('scale(' + transform.s.k[0]/100 + ', ' + transform.s.k[1]/100 + ')');
	}

	if (needsTransform) {
		if (hasAnimation) {
			if (transform.a.a === 1) {
				animatedProperty = property.createAnimatedProperty(currentName, '-anchor', transform.a.k, timeOffset);
				targets.addTarget(animatedProperty);
			} else if(transform.a.k[0] !== 0 || transform.a.k[1] !== 0){
				animatedProperty = property.createAnimatedPropertyFromStaticValue(currentName, '-anchor', transform.a.k, timeOffset);
				targets.addTarget(animatedProperty);
			}
		} else if (transform.a.a === 1) {
				hasAnimation = true;
				animatedProperty = property.createAnimatedProperty(currentName, '-anchor', transform.a.k, timeOffset);
				targets.addTarget(animatedProperty);
		} else {
			addToTransform('translate(' + -transform.a.k[0] + ', ' + -transform.a.k[1] + ')');
		}
	}

	return nodes;
}

module.exports = createTransformGroup;
},{"../../naming":16,"../../node":17,"../../property":19,"../../targets/targets":21}],7:[function(require,module,exports){
'use strict';

var xml = require('xml');
var fs = require('fs');
var node = require('./node');
var svgFactory = require('./svg/svg');
var config = require('./config');

function createAnimatedVectorObject() {
	var attributes = [{
		key: 'xmlns:android',
		value: 'http://schemas.android.com/apk/res/android'
	},{
		key: 'xmlns:aapt',
		value: 'http://schemas.android.com/aapt'
	}]
	var nodeElem = node.createNodeWithAttributes('animated-vector', attributes);
	return nodeElem;
}

function createAAPTVectorDrawable(animation, targets) {
	var aapt = node.createNodeWithAttributes('aapt:attr',[{key:'name', value:'android:drawable'}]);
	var vectorDrawable = createVectorDrawable(animation.w, animation.h);
	layer.addLayers(vectorDrawable, animation.layers, animation, targets, 'root_', 0);
	node.nestChild(aapt, vectorDrawable);
	return aapt;
}

function correctTargetsTimes(targets, framerate) {
	var i, len = targets.length;
	var j, jLen;
	var target, aapt_attr, set, setChildren, animator;
	var duration, startOffset;
	for(i = 0; i < len; i += 1) {
		target = targets[i];
		aapt_attr = node.getChild(target, 'aapt:attr');
		set = node.getChild(aapt_attr, 'set');
		setChildren = node.getChildren(set);
		jLen = setChildren.length;
		for(j = 1; j < jLen; j += 1) {
			animator = setChildren[j];
			duration = node.getAttribute(animator, 'android:duration');
			startOffset = node.getAttribute(animator, 'android:startOffset');
			if(duration) {
				node.addAttribute(animator, 'android:duration', Math.round(duration/framerate*1000));
			}
			if(startOffset) {
				node.addAttribute(animator, 'android:startOffset', Math.round(startOffset/framerate*1000));
			}
		}
	} 
}

function createVectorDrawable(width, height) {
	var attributes = [{
		key: 'android:height',
		value: height + 'dp'
	},{
		key: 'android:width',
		value: width + 'dp'
	},{
		key: 'android:viewportHeight',
		value: height
	},{
		key: 'android:viewportWidth',
		value: width
	}];
	var nodeElement = node.createNodeWithAttributes('vector', attributes, '');
	return nodeElement;
}

 module.exports = function(animation) {
 	return new Promise(function(resolve, reject){
 		var targets = [];
	 	//
	 	var _svg = svgFactory();
	 	_svg.processAnimation(animation)
	 	.then(_svg.exportNode)
	 	.then(function(svgNode){
	 		var format = config.xml_formatted ? '   ' : '';
 			var xmlString = xml(svgNode, format);
 			resolve(xmlString);

	 	}).catch(function(err){
	 		console.log(err.stack)
	 		reject(err.stack);
	 	});
	 	//
	 })
 };
},{"./config":2,"./node":17,"./svg/svg":20,"fs":25,"xml":24}],8:[function(require,module,exports){
var layer = require ('./layer');
var node = require ('../node');
var shapeFactory = require ('../layers/shape/shape');
var solidFactory = require ('../layers/solid/solid');
var textFactory = require ('../layers/text/text');
var naming = require('../naming');

function composition(compositionData, assets) {

	var compLayersData = compositionData.layers ||  getCompositionLayers(compositionData.refId, assets);

	var state = {
		inPoint: compositionData.ip || 0,
		outPoint: compositionData.op || 0,
		startPoint: compositionData.st || 0,
		layerData: compositionData,
		layers: []
	}

	function getCompositionLayers(compId, assets, layers) {
		var i = 0, len = assets.length;
		while (i < len) {
			if(assets[i].id === compId) {
				return assets[i].layers;
			}
			i += 1;
		}
		return [];
	}

	function createNodeInstance(grouper, groupName){
		var layers = state.layers;
		var i, len = layers.length;
		for (i = len - 1; i >= 0; i -= 1) {
			node.nestChild(grouper, layers[i].exportNode(groupName + naming.LAYER_NAME + '_' + i, state.workAreaOffset));
		}
	}

	function processData() {
		var i, len = compLayersData.length;
		var layer;
		for(i = 0; i < len; i += 1) {
			if(compLayersData[i].ty === 4) {
				layer = shapeFactory(compLayersData[i]);
			} else if(compLayersData[i].ty === 0) {
				layer = composition(compLayersData[i], assets);
			} else if(compLayersData[i].ty === 1) {
				layer = solidFactory(compLayersData[i]);
			} else if(compLayersData[i].ty === 5) {
				layer = textFactory(compLayersData[i]);
			} else {
				layer = null;
			}
			if(layer){
				layer.setTimeOffset(state.timeOffset + state.startPoint);
				layer.setSiblings(compLayersData);
				layer.processData();
				state.layers.push(layer);
			}
		}
		return factoryInstance;
	}

	var factoryInstance = {
		createNodeInstance: createNodeInstance,
		processData: processData
	};
	Object.assign(factoryInstance, layer(state)); 

	return factoryInstance;
}

module.exports = composition;
},{"../layers/shape/shape":12,"../layers/solid/solid":13,"../layers/text/text":14,"../naming":16,"../node":17,"./layer":9}],9:[function(require,module,exports){
var naming = require('../naming');
var node = require ('../node');
var masker = require ('./masker');
var property = require ('../property');
var targets = require ('../targets/targets');
var transformer = require ('./transformer');
var createTransformGroup = require ('../helpers/transform/createTransformGroup');

function layer(state) {

	state.timeOffset = 0;
	state.workAreaOffset = 0;

	function setTimeOffset(_timeOffset) {
		state.timeOffset = _timeOffset;
		return this;
	}

	function setWorkAreaOffset(_workAreaOffset) {
		state.workAreaOffset = _workAreaOffset;
		return this;
	}

	function exportNode(name, parentWorkAreaOffset) {
		var groupName = name + naming.GROUP_NAME;
		var rootMasks = factoryInstance.getMasks(name);
		var gr = node.createNode('g', groupName);
		var subGr;
		if(rootMasks.length) {
			var i, len = rootMasks.length;
			for(i = 0; i < len; i += 1) {
				subGr = node.createNode('g');
				node.addAttribute(subGr, 'clip-path','url(#' + rootMasks[i] + ')')
				node.nestChild(gr, subGr)
				this.createNodeInstance(subGr, groupName + naming.GROUP_NAME + '_' + i);
			}
		} else {
			gr = node.createNode('g', groupName);
			this.createNodeInstance(gr, groupName);
		}
		var parentNode = gr;
		if(state.layerData.ks){

			if (state.layerData.ks.o.a === 1) {
				animatedProperty = property.createAnimatedProperty(groupName, 'opacity', state.layerData.ks.o.k, state.timeOffset);
				targets.addTarget(animatedProperty);
			} else if(state.layerData.ks.o.k !== 100) {
				node.addAttribute(gr,'opacity', state.layerData.ks.o.k*0.01);
			}

			var transformArray = createTransformGroup(groupName, JSON.parse(JSON.stringify(state.layerData.ks)), state.timeOffset, parentNode);
			parentNode = node.nestArray(transformArray);
			var canReuse = false; //Todo find out if parent has not animated properties to reuse
			parentNode = factoryInstance.buildParenting(state.layerData.parent, parentNode, groupName, canReuse);
			parentNode = clipTimeLimits(parentNode, node.getAttribute(parentNode, 'id'), parentWorkAreaOffset);	
		}
		return parentNode;
	}

	function clipTimeLimits(group, name, parentWorkAreaOffset) {
		var inPoint = state.globalInPoint;
		var outPoint = state.globalOutPoint + state.timeOffset;
		var layerData = state.layerData;
		var animatedProp;
		var timeCap = property.getTimeCap();
		if(layerData.ip + state.timeOffset > 0 || layerData.op + state.timeOffset + parentWorkAreaOffset < timeCap) {
				name += naming.TIME_NAME;
				var timeGroup = node.createNode('g', name);
				node.nestChild(timeGroup, group);
				group = timeGroup;
				var limits = [];
			if(layerData.ip + state.timeOffset > 0) {
				limits.push({s:[0],e:[0],t:0,o:{x:0,y:0},i:{x:0,y:0}},{s:[0],e:[100],o:{x:0,y:0},i:{x:0,y:0},t:layerData.ip},{s:[100], e:[100],o:{x:0,y:0},i:{x:0,y:0}, t:layerData.ip + 0.0001});
			} else {
				limits.push({s:[100],e:[100],t:0,o:{x:0,y:0},i:{x:0,y:0}});
			}
			if(layerData.op + state.timeOffset + parentWorkAreaOffset < timeCap) {
				limits.push({s:[100],t:layerData.op + parentWorkAreaOffset ,o:{x:0,y:0},i:{x:0,y:0}, e:[0]},{s:[0],e:[0],o:{x:0,y:0},i:{x:0,y:0},t:layerData.op + parentWorkAreaOffset + 0.000001});
			}
			/*if(layerData.op + state.timeOffset + parentWorkAreaOffset < timeCap) {
				limits.push({s:[0],e:[100],t:0},{s:[100], e:[100], t:layerData.ip + state.timeOffset});
			}*/
			//layerData.op + state.timeOffset + parentWorkAreaOffset
			//animatedProp = property.createAnimatedProperty(name, 'opacity', limits, layerData.op + state.timeOffset + parentWorkAreaOffset);
			animatedProp = property.createAnimatedProperty(name, 'opacity', limits, state.timeOffset);
			targets.addTarget(animatedProp);
		}
		return group;
	}

	var factoryInstance = {
		setTimeOffset: setTimeOffset,
		setWorkAreaOffset: setWorkAreaOffset,
		exportNode: exportNode
	}
	return Object.assign(factoryInstance, masker(state), transformer(state));
}

module.exports = layer;
},{"../helpers/transform/createTransformGroup":6,"../naming":16,"../node":17,"../property":19,"../targets/targets":21,"./masker":10,"./transformer":15}],10:[function(require,module,exports){
var naming = require ('../naming');
var node = require ('../node');
var targets = require ('../targets/targets');
var property = require ('../property');
var createPathData = require ('../pathData');

function masker(state) {
	var masks = [];
	var maskCount = 0;
	var currentMaskData = {
		type:'',
		currentPaths: []
	};
	var clipName;
	var rootMasks = [];

	function buildMask(path, clipName, pathName, clipPathNode) {
		if(!clipPathNode) {
			clipPathNode = node.createNode('clipPath', clipName);
			node.addAttribute(clipPathNode,'id', clipName);
		}
		var pathNode = node.createNode('path', pathName);
		node.addAttribute(pathNode,'fill-rule','nonzero');
		node.nestChild(clipPathNode, pathNode);
		if(path) {
			node.addAttribute(pathNode,'d', path);
		}

		return clipPathNode;

	}

	function buildPreviousMaskGroup(){
		if(!currentMaskData.type){
			return;
		}
		var paths = currentMaskData.currentPaths;
		var i, len = paths.length, j, jLen;
		var clipName;
		var animatedProp, prevNode, maskNode;
		var pathName = clipName + naming.PATH_NAME;
		var clipPath;
		var clipPathString = '';
		for (i = 0; i < len; i+= 1) {
			if(i === 0) {
				clipName = paths[i].name;
			}
			pathName = clipName + naming.PATH_NAME + '_' + i;
			if (paths[i].pt.a === 1) {
				animatedProp = property.createAnimatedPathData(pathName, paths[i].pt.k, null, clipPathString, state.timeOffset);
				targets.addTarget(animatedProp);
			} else {
				clipPathString = createPathData(paths[i].pt.k, null);
			}
			clipPath = buildMask(clipPathString, clipName, pathName, clipPath);
			clipPathString = '';
		}
		targets.addTarget(clipPath);
		currentMaskData.currentPaths.length = 0;
		return clipPath;
	}

	function getMasks(name) {
		maskCount = 0;
		var previousClip = null;
		var masksProperties = state.layerData.masksProperties;
		var maskName = '';
		if(masksProperties) {
			var i, len = masksProperties.length, maskProp;
			for (i = 0; i < len; i += 1) {
				maskProp = masksProperties[i];
				maskName = name + naming.CLIP_NAME + '_' + maskCount;
				if (!maskProp.inv) {
					if (maskProp.mode === 'a') {
						if(currentMaskData.type !== 'a') {
							rootMasks.push(maskName);
							currentMaskData.type = 'a';
						}
						currentMaskData.currentPaths.push({pt:maskProp.pt, type:'a', name: maskName});
					} else if (maskProp.mode === 'i') {
						if(currentMaskData.type === 'a') {
							previousClip = buildPreviousMaskGroup();
						} else if(currentMaskData.type === '') {
							rootMasks.push(maskName);
						}
						currentMaskData.type = 'i';

						if(previousClip) {
							node.addAttribute(previousClip, 'clip-path','url(#' + maskName + ')')
						}
						currentMaskData.currentPaths.push({pt:maskProp.pt, type:'i', name: maskName});
						previousClip = buildPreviousMaskGroup(maskName);
					}
					maskCount += 1;
				}
			}
			if(currentMaskData.type === 'a') {
				buildPreviousMaskGroup();
			}
		}
		return rootMasks;
	}

	return {
		getMasks: getMasks
	}
}

module.exports = masker;
},{"../naming":16,"../node":17,"../pathData":18,"../property":19,"../targets/targets":21}],11:[function(require,module,exports){
var node = require ('../../node');
var property = require ('../../property');
var targets = require ('../../targets/targets');
var createTransformGroup = require ('../../helpers/transform/createTransformGroup');
var rgbHex = require('../../helpers/rgbToHex');
var Matrix = require('transformatrix');
var createPathData = require('../../pathData');
var naming = require('../../naming');

var matrix = new Matrix();
var degToRads = Math.PI/180;
var roundCorner = 0.5519;

function convertEllipseToPath(ellipseData) {
	if(ellipseData.s.a !== 0 || ellipseData.p.a !== 0) {
		return null;
	}
	var p0 = ellipseData.p.k[0], p1 = ellipseData.p.k[1], s0 = ellipseData.s.k[0]/2, s1 = ellipseData.s.k[1]/2;
	var vPoints = [[0,0],[0,0],[0,0],[0,0]];
	var oPoints = [[0,0],[0,0],[0,0],[0,0]];
	var iPoints = [[0,0],[0,0],[0,0],[0,0]];
    if(ellipseData.d !== 3){
        vPoints[0][0] = p0;
        vPoints[0][1] = p1-s1;
        vPoints[1][0] = p0 + s0;
        vPoints[1][1] = p1;
        vPoints[2][0] = p0;
        vPoints[2][1] = p1+s1;
        vPoints[3][0] = p0 - s0;
        vPoints[3][1] = p1;
        iPoints[0][0] = p0 - s0*roundCorner - vPoints[0][0];
        iPoints[0][1] = p1 - s1 - vPoints[0][1];
        iPoints[1][0] = p0 + s0 - vPoints[1][0];
        iPoints[1][1] = p1 - s1*roundCorner - vPoints[1][1];
        iPoints[2][0] = p0 + s0*roundCorner - vPoints[2][0];
        iPoints[2][1] = p1 + s1 - vPoints[2][1];
        iPoints[3][0] = p0 - s0 - vPoints[3][0];
        iPoints[3][1] = p1 + s1*roundCorner - vPoints[3][1];
        oPoints[0][0] = p0 + s0*roundCorner - vPoints[0][0];
        oPoints[0][1] = p1 - s1 - vPoints[0][1];
        oPoints[1][0] = p0 + s0 - vPoints[1][0];
        oPoints[1][1] = p1 + s1*roundCorner - vPoints[1][1];
        oPoints[2][0] = p0 - s0*roundCorner - vPoints[2][0];
        oPoints[2][1] = p1 + s1 - vPoints[2][1];
        oPoints[3][0] = p0 - s0 - vPoints[3][0];
        oPoints[3][1] = p1 - s1*roundCorner - vPoints[3][1];
    }else{
        vPoints[0][0] = p0;
        vPoints[0][1] = p1-s1;
        vPoints[1][0] = p0 - s0;
        vPoints[1][1] = p1;
        vPoints[2][0] = p0;
        vPoints[2][1] = p1+s1;
        vPoints[3][0] = p0 + s0;
        vPoints[3][1] = p1;
        iPoints[0][0] = p0 + s0*cPoint - vPoints[0][0];
        iPoints[0][1] = p1 - s1 - vPoints[0][1];
        iPoints[1][0] = p0 - s0 - vPoints[1][0];
        iPoints[1][1] = p1 - s1*cPoint - vPoints[1][1];
        iPoints[2][0] = p0 - s0*cPoint - vPoints[2][0];
        iPoints[2][1] = p1 + s1 - vPoints[2][1];
        iPoints[3][0] = p0 + s0 - vPoints[3][0];
        iPoints[3][1] = p1 + s1*cPoint - vPoints[3][1];
        oPoints[0][0] = p0 - s0*cPoint - vPoints[0][0];
        oPoints[0][1] = p1 - s1 - vPoints[0][1];
        oPoints[1][0] = p0 - s0 - vPoints[1][0];
        oPoints[1][1] = p1 + s1*cPoint - vPoints[1][1];
        oPoints[2][0] = p0 + s0*cPoint - vPoints[2][0];
        oPoints[2][1] = p1 + s1 - vPoints[2][1];
        oPoints[3][0] = p0 + s0 - vPoints[3][0];
        oPoints[3][1] = p1 - s1*cPoint - vPoints[3][1];
    }
	var pathObject = {
		ks: {
			a:0,
			k: {
				i:iPoints,
				v:vPoints,
				o:oPoints,
				c: true
			}
		}
	}
	return pathObject;
}

function convertRectangleToPath(rectangleData) {
	if(rectangleData.s.a !== 0 || rectangleData.p.a !== 0 || rectangleData.r.a !== 0) {
		return null;
	}


	/*var p0 = this.p.v[0], p1 = this.p.v[1], v0 = this.s.v[0]/2, v1 = this.s.v[1]/2;
    var round = bm_min(v0,v1,this.r.v);
    var cPoint = round*(1-roundCorner);
    this.v._length = 0;

    if(this.d === 2 || this.d === 1) {
        this.v.setTripleAt(p0+v0, p1-v1+round,p0+v0, p1-v1+round,p0+v0,p1-v1+cPoint,0, true);
        this.v.setTripleAt(p0+v0, p1+v1-round,p0+v0, p1+v1-cPoint,p0+v0, p1+v1-round,1, true);
        if(round!== 0){
            this.v.setTripleAt(p0+v0-round, p1+v1,p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,2, true);
            this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,p0-v0+round,p1+v1,3, true);
            this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,4, true);
            this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,p0-v0,p1-v1+round,5, true);
            this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,6, true);
            this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,p0+v0-round,p1-v1,7, true);
        } else {
            this.v.setTripleAt(p0-v0,p1+v1,p0-v0+cPoint,p1+v1,p0-v0,p1+v1,2);
            this.v.setTripleAt(p0-v0,p1-v1,p0-v0,p1-v1+cPoint,p0-v0,p1-v1,3);
        }
    }else{
        this.v.setTripleAt(p0+v0,p1-v1+round,p0+v0,p1-v1+cPoint,p0+v0,p1-v1+round,0, true);
        if(round!== 0){
            this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,1, true);
            this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,p0-v0+round,p1-v1,2, true);
            this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,3, true);
            this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,p0-v0,p1+v1-round,4, true);
            this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,5, true);
            this.v.setTripleAt(p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,p0+v0-round,p1+v1,6, true);
            this.v.setTripleAt(p0+v0,p1+v1-round,p0+v0,p1+v1-round,p0+v0,p1+v1-cPoint,7, true);
        } else {
            this.v.setTripleAt(p0-v0,p1-v1,p0-v0+cPoint,p1-v1,p0-v0,p1-v1,1, true);
            this.v.setTripleAt(p0-v0,p1+v1,p0-v0,p1+v1-cPoint,p0-v0,p1+v1,2, true);
            this.v.setTripleAt(p0+v0,p1+v1,p0+v0-cPoint,p1+v1,p0+v0,p1+v1,3, true);

        }
    }*/



	var p0 = rectangleData.p.k[0], p1 = rectangleData.p.k[1], v0 = rectangleData.s.k[0]/2, v1 = rectangleData.s.k[1]/2; 
    var round = Math.min(v0,v1,rectangleData.r.k);
    var cPoint = round*(1-roundCorner);
	var vPoints = [];
	var oPoints = [];
	var iPoints = [];
	if(rectangleData.d === 2 || rectangleData.d === 1) {
		vPoints[0] = [p0+v0, p1-v1+round];
		oPoints[0] = [p0+v0 - vPoints[0][0], p1-v1+round - vPoints[0][1]];
		iPoints[0] = [p0+v0 - vPoints[0][0], p1-v1+cPoint - vPoints[0][1]];
		vPoints[1] = [p0+v0, p1+v1-round];
		oPoints[1] = [p0+v0 - vPoints[1][0], p1+v1-cPoint - vPoints[1][1]];
		iPoints[1] = [p0+v0 - vPoints[1][0], p1+v1-round - vPoints[1][1]];

        if(round!== 0){
			vPoints[2] = [p0+v0-round, p1+v1];
			oPoints[2] = [p0+v0-round - vPoints[2][0], p1+v1 - vPoints[2][1]];
			iPoints[2] = [p0+v0-cPoint - vPoints[2][0], p1+v1 - vPoints[2][1]];
			vPoints[3] = [p0-v0+round, p1+v1];
			oPoints[3] = [p0-v0+cPoint - vPoints[3][0], p1+v1 - vPoints[3][1]];
			iPoints[3] = [p0-v0+round - vPoints[3][0], p1+v1 - vPoints[3][1]];
			vPoints[4] = [p0-v0, p1+v1-round];
			oPoints[4] = [p0-v0 - vPoints[4][0], p1+v1-round - vPoints[4][1]];
			iPoints[4] = [p0-v0 - vPoints[4][0], p1+v1-cPoint - vPoints[4][1]];
			vPoints[5] = [p0-v0, p1-v1+round];
			oPoints[5] = [p0-v0 - vPoints[5][0], p1-v1+cPoint - vPoints[5][1]];
			iPoints[5] = [p0-v0 - vPoints[5][0], p1-v1+round - vPoints[5][1]];
			vPoints[6] = [p0-v0+round, p1-v1];
			oPoints[6] = [p0-v0+round - vPoints[6][0], p1-v1 - vPoints[6][1]];
			iPoints[6] = [p0-v0+cPoint - vPoints[6][0], p1-v1 - vPoints[6][1]];
			vPoints[7] = [p0+v0-round, p1-v1];
			oPoints[7] = [p0+v0-cPoint - vPoints[7][0], p1-v1 - vPoints[7][1]];
			iPoints[7] = [p0+v0-round - vPoints[7][0], p1-v1 - vPoints[7][1]];
        } else {
			vPoints[2] = [p0-v0, p1+v1];
			oPoints[2] = [p0-v0+cPoint - vPoints[2][0], p1+v1 - vPoints[2][1]];
			iPoints[2] = [p0-v0 - vPoints[2][0], p1+v1 - vPoints[2][1]];
			vPoints[3] = [p0-v0, p1-v1];
			oPoints[3] = [p0-v0 - vPoints[3][0], p1-v1+cPoint - vPoints[3][1]];
			iPoints[3] = [p0-v0 - vPoints[3][0], p1-v1 - vPoints[3][1]];
        }
    } else {
		vPoints[0] = [p0+v0, p1-v1+round];
		oPoints[0] = [p0+v0 - vPoints[0][0], p1-v1+cPoint - vPoints[0][1]];
		iPoints[0] = [p0+v0 - vPoints[0][0], p1-v1+round - vPoints[0][1]];

        if(round!== 0){
			vPoints[1] = [p0+v0-round, p1-v1];
			oPoints[1] = [p0+v0-round - vPoints[1][0], p1-v1 - vPoints[1][1]];
			iPoints[1] = [p0+v0-cPoint - vPoints[1][0], p1-v1 - vPoints[1][1]];
			vPoints[2] = [p0-v0+round, p1-v1];
			oPoints[2] = [p0-v0+cPoint - vPoints[2][0], p1-v1 - vPoints[2][1]];
			iPoints[2] = [p0-v0+round - vPoints[2][0], p1-v1 - vPoints[2][1]];
			vPoints[3] = [p0-v0, p1-v1+round];
			oPoints[3] = [p0-v0 - vPoints[3][0], p1-v1+round - vPoints[3][1]];
			iPoints[3] = [p0-v0 - vPoints[3][0], p1-v1+cPoint - vPoints[3][1]];
			vPoints[4] = [p0-v0, p1+v1-round];
			oPoints[4] = [p0-v0 - vPoints[4][0], p1+v1-cPoint - vPoints[4][1]];
			iPoints[4] = [p0-v0 - vPoints[4][0], p1+v1-round - vPoints[4][1]];
			vPoints[5] = [p0-v0+round, p1+v1];
			oPoints[5] = [p0-v0+round - vPoints[5][0], p1+v1 - vPoints[5][1]];
			iPoints[5] = [p0-v0+cPoint - vPoints[5][0], p1+v1 - vPoints[5][1]];
			vPoints[6] = [p0+v0-round, p1+v1];
			oPoints[6] = [p0+v0-cPoint - vPoints[6][0], p1+v1 - vPoints[6][1]];
			iPoints[6] = [p0+v0-round - vPoints[6][0], p1+v1 - vPoints[6][1]];
			vPoints[7] = [p0+v0, p1+v1-round];
			oPoints[7] = [p0+v0 - vPoints[7][0], p1+v1-round - vPoints[7][1]];
			iPoints[7] = [p0+v0 - vPoints[7][0], p1+v1-cPoint - vPoints[7][1]];
        } else {
			vPoints[1] = [p0-v0, p1-v1];
			oPoints[1] = [p0-v0+cPoint - vPoints[1][0], p1-v1 - vPoints[1][1]];
			iPoints[1] = [p0-v0 - vPoints[1][0], p1-v1 - vPoints[1][1]];
			vPoints[2] = [p0-v0, p1+v1];
			oPoints[2] = [p0-v0 - vPoints[2][0], p1+v1-cPoint - vPoints[2][1]];
			iPoints[2] = [p0-v0 - vPoints[2][0], p1+v1 - vPoints[2][1]];
			vPoints[3] = [p0+v0, p1+v1];
			oPoints[3] = [p0+v0-cPoint - vPoints[3][0], p1+v1 - vPoints[3][1]];
			iPoints[3] = [p0+v0 - vPoints[3][0], p1+v1 - vPoints[3][1]];

        }
    }
	var pathObject = {
		ks: {
			a:0,
			k: {
				i:iPoints,
				v:vPoints,
				o:oPoints,
				c: true
			}
		}
	}
	return pathObject;
}

function drawable(_drawableData, _level, _timeOffset) {
	var paths = [];
	var level = _level;
	var drawableData = _drawableData;
	var closed = false;
	var timeOffset = _timeOffset;

	function getDrawingAttributes(pathName) {
		var attributes = [];
		var hexColor;
		var color = drawableData.c;
		var animatedProp;
		if(drawableData.ty === 'st') {
			if (color.a === 0) {
				hexColor = rgbHex(color.k[0]*255,color.k[1]*255,color.k[2]*255);
				attributes.push({
					key: 'stroke',
					value: hexColor
				})
			} else {
				hexColor = rgbHex(color.k[0].s[0]*255,color.k[0].s[1]*255,color.k[0].s[2]*255)
				attributes.push({
					key: 'stroke',
					value: hexColor
				})
				animatedProp = property.createAnimatedProperty(pathName, 'strokeColor', color.k, timeOffset);
				targets.addTarget(animatedProp);
			}
			attributes.push({
				key: 'stroke-linecap',
				value: 'round'
			})
			attributes.push({
				key: 'stroke-linejoin',
				value: 'round'
			})
			attributes.push({
				key: 'fill',
				value: 'none'
			})
			
			if(drawableData.w.a === 0) {
				attributes.push({
					key: 'stroke-width',
					value: drawableData.w.k
				})
			} else {
				attributes.push({
					key: 'stroke-width',
					value: drawableData.w.k[0].s
				})
				animatedProp = property.createAnimatedProperty(pathName, 'strokeWidth', drawableData.w.k, timeOffset);
				targets.addTarget(animatedProp);
			}
			if(drawableData.o.a === 0) {
				attributes.push({
					key: 'stroke-opacity',
					value: drawableData.o.k * 0.01
				})
			} else {
				attributes.push({
					key: 'stroke-opacity',
					value: drawableData.o.k[0].s * 0.01
				})
				animatedProp = property.createAnimatedProperty(pathName, 'strokeAlpha', drawableData.o.k, timeOffset);
				targets.addTarget(animatedProp);
			}
			
		} else if(drawableData.ty === 'fl') {
			if (color.a === 0) {
				hexColor = rgbHex(color.k[0]*255,color.k[1]*255,color.k[2]*255)
				attributes.push({
					key: 'fill',
					value: hexColor
				})
			} else {
				hexColor = rgbHex(color.k[0].s[0]*255,color.k[0].s[1]*255,color.k[0].s[2]*255)
				attributes.push({
					key: 'fill',
					value: hexColor
				})
				animatedProp = property.createAnimatedProperty(pathName, 'fillColor', color.k, timeOffset);
				targets.addTarget(animatedProp);
			}
			if(drawableData.o.a === 0) {
				attributes.push({
					key: 'fill-opacity',
					value: drawableData.o.k * 0.01
				})
			} else {
				attributes.push({
					key: 'fill-opacity',
					value: drawableData.o.k[0].s * 0.01
				})
				animatedProp = property.createAnimatedProperty(pathName, 'fillAlpha', drawableData.o.k, timeOffset);
				targets.addTarget(animatedProp);
			}
			attributes.push({
				key: 'fill-rule',
				value: drawableData.r === 1 ? 'nonzero' : 'evenodd'
			})
		}
		return attributes;
	}

	function isTransformAnimated(transform) {
		if(transform.p && transform.p.a === 1) {
			return true;
		}
		if(transform.a && transform.a.a === 1) {
			return true;
		}
		if(transform.s && transform.s.a === 1) {
			return true;
		}
		if(transform.r && transform.r.a === 1) {
			return true;
		}
		if(transform.o && transform.o.a === 1 || transform.o.k !== 100) {
			return true;
		}
		return false;
	}
	
	function addPath(path, transforms, level, trimPath) {
		if (closed) {
			return;
		}
		paths.push({type: 'path', path: path, transforms: transforms, level: level, trimPath: trimPath});
	}
	
	function addEllipse(shapeData, transforms, level, trimPath) {
		if (closed) {
			return;
		}
		if(shapeData.s.a === 0 && shapeData.p.a === 0) {
			var pathConverted = convertEllipseToPath(shapeData);
			if(pathConverted) {
				paths.push({type: 'path', path: pathConverted, transforms: transforms, level: level, trimPath: trimPath});
			}
		} else {
			paths.push({type:'ellipse', s: shapeData.s, p: shapeData.p, transforms: transforms, level: level, trimPath: trimPath});
		}
	}
	
	function addRectangle(shapeData, transforms, level, trimPath) {
		if (closed) {
			return;
		}
		if(shapeData.r.a === 0 && shapeData.s.a === 0 && shapeData.p.a === 0) {
			var pathConverted = convertRectangleToPath(shapeData);
			if(pathConverted) {
				paths.push({type:'path', path: pathConverted, transforms: transforms, level: level, trimPath: trimPath});
			}
		} else {
			paths.push({type:'rect', r: shapeData.r, s: shapeData.s, p: shapeData.p, transforms: transforms, level: level, trimPath: trimPath});
		}
	}

	function canFlattenPath(transforms, level) {
		var i = 0;
		while (i < level) {
			if(isTransformAnimated(transforms[i])){
				return false;
			}
			i += 1;
		}
		return true;
	}

	function buildNewEllipse(pathData, pathName) {
		var pathAttributes = [].concat(getDrawingAttributes(pathName));
		if(pathData.s.a === 0) {
			pathAttributes.push({
				key: 'cx',
				value: pathData.s.k[0]
			})
			pathAttributes.push({
				key: 'cy',
				value: pathData.s.k[1]
			})
			pathAttributes.push({
				key: 'transform',
				value: 'translate(' + -pathData.s.k[0]/2 + ' ' + -pathData.s.k[1]/2 + ')'
			})
		} else {
			animatedProp = property.createAnimatedProperty(pathName, 'ellipseWidth', pathData.s.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, 'ellipseHeight', pathData.s.k, timeOffset);
			targets.addTarget(animatedProp);
		}
		if(pathData.p.a === 0) {
			pathAttributes.push({
				key: 'cx',
				value: pathData.p.k[0]
			})
			pathAttributes.push({
				key: 'cy',
				value: pathData.p.k[1]
			})
		} else {
			animatedProp = property.createAnimatedProperty(pathName, 'ellipsePositionX', pathData.p.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, 'ellipsePositionY', pathData.p.k, timeOffset);
			targets.addTarget(animatedProp);
		}

		var pathNode = node.createNodeWithAttributes('ellipse', pathAttributes, pathName);
		var finalNode = pathNode;

		var transforms = pathData.transforms;
		var j, jLen = pathData.level;

		if(!canFlattenPath(transforms, jLen)){
			for(j = jLen - 1; j >= 0; j -= 1) {
				nestedArray = [finalNode].concat(createTransformGroup(pathName + naming.GROUP_NAME +'_' + j, JSON.parse(JSON.stringify(transforms[j])), timeOffset));
				finalNode = node.nestArray(nestedArray);
			}
		}

		return finalNode;
	}

	function buildNewRect(pathData, pathName) {
		var pathAttributes = [].concat(getDrawingAttributes(pathName));
		if(pathData.s.a === 0) {
			pathAttributes.push({
				key: 'width',
				value: pathData.s.k[0]
			})
			pathAttributes.push({
				key: 'height',
				value: pathData.s.k[1]
			})
			pathAttributes.push({
				key: 'transform',
				value: 'translate(' + -pathData.s.k[0]/2 + ' ' + -pathData.s.k[1]/2 + ')'
			})
		} else {
			animatedProp = property.createAnimatedProperty(pathName, 'rectWidth', pathData.s.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, 'rectHeight', pathData.s.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, '-position', pathData.s.k, timeOffset);
			targets.addTarget(animatedProp);
		}
		if(pathData.p.a === 0) {
			pathAttributes.push({
				key: 'x',
				value: pathData.p.k[0]
			})
			pathAttributes.push({
				key: 'y',
				value: pathData.p.k[1]
			})
		} else {
			animatedProp = property.createAnimatedProperty(pathName, 'rectPositionX', pathData.p.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, 'rectPositionY', pathData.p.k, timeOffset);
			targets.addTarget(animatedProp);
		}
		if(pathData.r.a === 0) {
			if(pathData.r.k !== 0) {
				pathAttributes.push({
					key: 'rx',
					value: pathData.r.k
				})
				pathAttributes.push({
					key: 'ry',
					value: pathData.r.k
				})
			}
		} else {
			animatedProp = property.createAnimatedProperty(pathName, 'rx', pathData.r.k, timeOffset);
			targets.addTarget(animatedProp);
			animatedProp = property.createAnimatedProperty(pathName, 'ry', pathData.r.k, timeOffset);
			targets.addTarget(animatedProp);
		}
		var pathNode = node.createNodeWithAttributes('rect', pathAttributes, pathName);
		var finalNode = pathNode;

		var transforms = pathData.transforms;
		var j, jLen = pathData.level;

		if(!canFlattenPath(transforms, jLen)){
			for(j = jLen - 1; j >= 0; j -= 1) {
				nestedArray = [finalNode].concat(createTransformGroup(pathName + naming.GROUP_NAME +'_' + j, JSON.parse(JSON.stringify(transforms[j])), timeOffset));
				finalNode = node.nestArray(nestedArray);
			}
		}

		return finalNode;
	}

	function buildNewPath(pathList, pathName) {
		var pathAttributes = [].concat(getDrawingAttributes(pathName));
		var pathNode = node.createNodeWithAttributes('path', pathAttributes, pathName);
		var finalNode = pathNode;
		var groupNode, nestedGroupNode, nestedArray;
		var i, len = pathList.length;
		var j, jLen;
		matrix.reset();
		var transforms;
		var finalPathData = '';
		var animatedProp, currentAnimatedProp;
		var currentPath, pathData;
		for(i = 0; i < len; i += 1){
			pathData = pathList[i];
			transforms = pathData.transforms;
			jLen = pathData.level;
			matrix.reset();

			if(!canFlattenPath(transforms, jLen)){
				for(j = jLen - 1; j >= 0; j -= 1) {
					nestedArray = [finalNode].concat(createTransformGroup(pathName + naming.GROUP_NAME +'_' + j, JSON.parse(JSON.stringify(transforms[j])), timeOffset));
					finalNode = node.nestArray(nestedArray);
					var name = node.getAttribute(finalNode, 'id');
				}
			} else {
				for(j = 0; j < jLen; j += 1) {
					matrix.translate(transforms[j].p.k[0], transforms[j].p.k[1]);
					matrix.scale(transforms[j].s.k[0]/100, transforms[j].s.k[1]/100);
					matrix.rotate(transforms[j].r.k*degToRads);
					matrix.translate(-transforms[j].a.k[0], -transforms[j].a.k[1]);
				}
			}

			if(pathData.path.ks.a === 0) {
				currentPath = ' ' + createPathData(pathData.path.ks.k, matrix);
				finalPathData += currentPath;
				if(animatedProp) {
					//var fromValue = node.getAttribute(animatedProp,'from') + ';' + currentPath;
					//var toValue = node.getAttribute(animatedProp,'to') + ';' + currentPath;
					var valuesList = node.getAttribute(animatedProp,'values').split(';');
					jLen = valuesList.length;
					var valuesValue = '';
					for(j = 0; j < jLen; j += 1) {
						valuesValue += valuesValue ? ';':'';
						valuesValue += valuesList[j] + currentPath;
					}
					//node.addAttribute(animatedProp,'from', fromValue);
					//node.addAttribute(animatedProp,'to', toValue);
					node.addAttribute(animatedProp,'values', valuesValue);
				}
			} else {
				if(animatedProp) {
					var tempAnimatedProp = property.createAnimatedPathData(pathName, pathData.path.ks.k, matrix, '', timeOffset);
					//var fromValue = node.getAttribute(animatedProp,'from') + ';' + currentPath;
					//var toValue = node.getAttribute(animatedProp,'to') + ';' + currentPath;
					var valuesList = node.getAttribute(animatedProp,'values').split(';');
					var tempValuesList = node.getAttribute(tempAnimatedProp,'values').split(';');
					var firstKeyframe = pathData.path.ks.k[0];
					var lastKeyframe = pathData.path.ks.k[pathData.path.ks.k.length - 2];
					jLen = valuesList.length;
					var valuesValue = '';
					for(j = 0; j < jLen; j += 1) {
						valuesValue += valuesValue ? ';':'';
						valuesValue += valuesList[j] + ' ' + tempValuesList[j];
					}
					//node.addAttribute(animatedProp,'from', fromValue);
					//node.addAttribute(animatedProp,'to', toValue);
					node.addAttribute(animatedProp,'values', valuesValue);
				} else {
					animatedProp = property.createAnimatedPathData(pathName, pathData.path.ks.k, matrix, finalPathData, timeOffset);
					currentPath = ' ' + createPathData(pathData.path.ks.k[0].s[0], matrix);
					finalPathData += currentPath;
					targets.addTarget(animatedProp);
				}
			}

			/*
			if(pathData.trimPath) {
				var trimPathData = pathData.trimPath;
				var startValue, endValue, offsetValue;
				if (trimPathData.s.a === 0) {
					startValue = trimPathData.s.k * 0.01;
				} else {
					startValue = trimPathData.s.k[0].s * 0.01;
					animatedProp = property.createAnimatedProperty(pathName, 'trimPathStart', trimPathData.s.k, timeOffset);
					targets.addTarget(animatedProp);
				}
				if (trimPathData.e.a === 0) {
					endValue = trimPathData.e.k * 0.01;
				} else {
					endValue = trimPathData.e.k[0].s * 0.01;
					animatedProp = property.createAnimatedProperty(pathName, 'trimPathEnd', trimPathData.e.k, timeOffset);
					targets.addTarget(animatedProp);
				}
				if (trimPathData.o.a === 0) {
					offsetValue = trimPathData.o.k * 1/360;
				} else {
					offsetValue = trimPathData.o.k[0].s * 1/360;
					animatedProp = property.createAnimatedProperty(pathName, 'trimPathOffset', trimPathData.o.k, timeOffset);
					targets.addTarget(animatedProp);
				}
				node.addAttribute(pathNode,'android:trimPathStart', startValue);
				node.addAttribute(pathNode,'android:trimPathEnd', endValue);
				node.addAttribute(pathNode,'stroke-dashoffset', offsetValue);
			}
			*/
		}
		node.addAttribute(pathNode,'d', finalPathData);

		return finalNode;
	}

	function keyframesAreEqual(keyframes1, keyframes2) {
		if(keyframes1.length !== keyframes2.length) {
			return false;
		}
		var i = 0, len = keyframes1.length;
		while (i<len) {
			if(keyframes1[i].t !== keyframes2[i].t || keyframes1[i].n !== keyframes2[i].n){
				return false;
			}
			i += 1;
		}
		return true;
	}

	function areTransformsEqual(pathList, transforms) {
		var listTransforms = pathList[0].transforms;
		if(listTransforms.length !== transforms.length) {
			return false;
		}
		var i = 0, len = listTransforms.length;
		while(i < len) {
			if(listTransforms[i] !== transforms[i]){
				return false;
			}
			i += 1;
		}
		return true;
	}

	function exportDrawables(name, _timeOffset) {
		timeOffset = _timeOffset;
		var drawableNodes = [];
		var i, len = paths.length, nodeElem;
		var pathName, pathOpen = false, pathCount = 0, pathAttributes;
		var currentPathList = [];
		var pathData, hasAnimatedPath = false;
		var lastAnimatedPath;
		for(i = 0; i < len; i += 1) {
			pathData = paths[i];
			if(pathData.type === 'rect') {
				if(currentPathList.length) {
					pathName = name + naming.PATH_NAME + '_' + pathCount;
					nodeElem = buildNewPath(currentPathList, pathName);
					drawableNodes.push(nodeElem);
					currentPathList.length = 0;
					hasAnimatedPath = false;
					pathCount += 1;
				}
				pathName = name + naming.PATH_NAME + '_' + pathCount;
				nodeElem = buildNewRect(pathData, pathName);
				drawableNodes.push(nodeElem);
				pathCount += 1;
			} else if(pathData.type === 'ellipse') {
				if(currentPathList.length) {
					pathName = name + naming.PATH_NAME + '_' + pathCount;
					nodeElem = buildNewPath(currentPathList, pathName);
					drawableNodes.push(nodeElem);
					currentPathList.length = 0;
					hasAnimatedPath = false;
					pathCount += 1;
				}
				pathName = name + naming.PATH_NAME + '_' + pathCount;
				nodeElem = buildNewEllipse(pathData, pathName);
				drawableNodes.push(nodeElem);
				pathCount += 1;
			} else if(!currentPathList.length 
				|| (((!hasAnimatedPath && pathData.path.ks.a === 1) || pathData.path.ks.a === 0 || (pathData.path.ks.a === 1 && keyframesAreEqual(lastAnimatedPath.k, pathData.path.ks.k)))) /* && canFlattenPath(pathData.transforms, pathData.level) */ && areTransformsEqual(currentPathList, pathData.transforms) && !pathData.trimPath) {
				if(pathData.path.ks.a === 1) {
					lastAnimatedPath = pathData.path.ks;
					hasAnimatedPath = true;
				}
				currentPathList.push(pathData);
			} else {
				pathName = name + naming.PATH_NAME + '_' + pathCount;
				nodeElem = buildNewPath(currentPathList, pathName);
				drawableNodes.push(nodeElem);
				currentPathList.length = 0;
				hasAnimatedPath = false;
				pathCount += 1;
				currentPathList.push(pathData);
			}
		}
		if (currentPathList.length) {
			pathName = name + naming.PATH_NAME + '_' + pathCount;
			nodeElem = buildNewPath(currentPathList, pathName);
			drawableNodes.push(nodeElem);
		}
		return drawableNodes;
	}

	function close() {
		closed = true;
	}

	var factoryInstance = {
		addPath: addPath,
		addEllipse: addEllipse,
		addRectangle: addRectangle,
		exportDrawables: exportDrawables,
		close: close
	}

	return factoryInstance;
}

module.exports = drawable;
},{"../../helpers/rgbToHex":4,"../../helpers/transform/createTransformGroup":6,"../../naming":16,"../../node":17,"../../pathData":18,"../../property":19,"../../targets/targets":21,"transformatrix":22}],12:[function(require,module,exports){
var layer = require ('../layer');
var drawableFactory = require ('./drawable');
var node = require ('../../node');
var naming = require('../../naming');

function shape(layerData, _level) {

	var drawables = [];
	var transforms = [];
	var level = _level || 0;
	var trimPath;

	var state = {
		shapes: layerData.shapes || layerData.it,
		layerData: layerData
	}

	function createNodeInstance(grouper, groupName){
		var drawableNodes;
		var i, len = drawables.length;
		var j, jLen;
		for(i = 0; i < len; i += 1) {
			drawableNodes = drawables[i].exportDrawables(groupName + naming.DRAWABLE_NAME + '_' + i, state.timeOffset);
			jLen = drawableNodes.length;
			for(j = 0; j < jLen; j += 1) {
				node.nestChild(grouper, drawableNodes[j]);
			}
		}
	}

	function addPathToDrawables(path) {
		var i, len = drawables.length;
		for(i = 0; i < len; i += 1) {
			drawables[i].addPath(path, transforms, level, trimPath);
		}
	}

	function addEllipseToDrawables(shapeData) {
		var i, len = drawables.length;
		for(i = 0; i < len; i += 1) {
			drawables[i].addEllipse(shapeData, transforms, level, trimPath);
		}
	}

	function addRectToDrawables(shapeData) {
		var i, len = drawables.length;
		for(i = 0; i < len; i += 1) {
			drawables[i].addRectangle(shapeData, transforms, level, trimPath);
		}
	}

	function processData() {
		var i,  len = state.shapes.length;
		var shapeGroup, drawable;
		var localDrawables = [];
		for (i = len - 1; i >= 0; i -= 1) {
			if(state.shapes[i].ty === 'gr') {
				shapeGroup = shape(state.shapes[i], level + 1);
				shapeGroup.setTimeOffset(state.timeOffset)
				.setDrawables(drawables)
				.setTransforms(transforms)
				.setTrimPath(trimPath)
				.processData();
			} else if(state.shapes[i].ty === 'fl' || state.shapes[i].ty === 'st') {
				drawable = drawableFactory(state.shapes[i], level, state.timeOffset);
				drawables.push(drawable);
				localDrawables.push(drawable);
			} else if(state.shapes[i].ty === 'tr') {
				transforms.push(state.shapes[i]);
			} else if(state.shapes[i].ty === 'sh') {
				addPathToDrawables(state.shapes[i]);
			} else if(state.shapes[i].ty === 'el') {
				addEllipseToDrawables(state.shapes[i]);
			} else if(state.shapes[i].ty === 'rc') {
				addRectToDrawables(state.shapes[i]);
			} else if(state.shapes[i].ty === 'tm') {
				trimPath = state.shapes[i];
			} else {
				//console.log(state.shapes[i].ty)
			}
		}

		len = localDrawables.length;
		for(i = 0; i < len; i += 1) {
			drawable = localDrawables[i];
			drawable.close();
		}
		return factoryInstance;
	}

	function setTrimPath(_trimPath) {
		trimPath = _trimPath;
		return factoryInstance;
	}

	function setDrawables(_drawables) {
		drawables = _drawables;
		return factoryInstance;
	}

	function setTransforms(_transforms) {
		var i, len = _transforms.length;
		for(i = 0; i < len; i += 1) {
			transforms.push(_transforms[i]);
		}
		return factoryInstance;
	}

	var factoryInstance = {
		setDrawables: setDrawables,
		setTransforms: setTransforms,
		setTrimPath: setTrimPath,
		processData: processData,
		createNodeInstance: createNodeInstance
	};
	Object.assign(factoryInstance, layer(state)); 
	
	return factoryInstance;
}

module.exports = shape;
},{"../../naming":16,"../../node":17,"../layer":9,"./drawable":11}],13:[function(require,module,exports){
var node = require ('../../node');
var naming = require ('../../naming');
var layer = require ('../layer');

function solid(layerData) {

	var state = {
		layerData: layerData
	}

	function createNodeInstance(grouper, groupName) {
		var layerData = state.layerData;
		var attributes = [
			{
				key: 'fill',
				value: state.layerData.sc
			},
			{
				key: 'width',
				value: layerData.sw
			},
			{
				key: 'height',
				value: layerData.sh
			}
		];
		var path = node.createNodeWithAttributes('rect', attributes, groupName + naming.SOLID_NAME);
		if(!(layerData.ks && layerData.ks.o && layerData.ks.o.a === 0 && layerData.ks.o.k === 0)) {
			node.nestChild(grouper, path);
		}
	}

	function processData() {}

	var factoryInstance = {
		createNodeInstance: createNodeInstance,
		processData: processData
	};

	Object.assign(factoryInstance, layer(state)); 

	return factoryInstance;
}

module.exports = solid;
},{"../../naming":16,"../../node":17,"../layer":9}],14:[function(require,module,exports){
var layer = require ('../layer');
var node = require ('../../node');
var naming = require('../../naming');
var rgbHex = require('../../helpers/rgbToHex');
var fonts = require('../../helpers/fonts');

function shape(layerData) {


	var state = {
		shapes: layerData.shapes || layerData.it,
		layerData: layerData
	}

	function getTextAnchor(alignment) {
		switch(alignment) {
			case 0:
				return 'start'
			case 1:
				return 'end'
			case 2:
			default:
				return 'middle'
		}
	}

	function createNodeInstance(grouper, groupName){
		var textData = state.layerData.t.d.k[0].s;
		var attributes = [
			{
				key: 'font-size',
				value: textData.s + 'px'
			},
			{
				key: 'font-family',
				value: fonts.getFontFamily(textData.f)
			},
			{
				key: 'font-weight',
				value: fonts.getFontWeight(textData.f)
			},
			{
				key: 'fill',
				value: rgbHex(textData.fc[0]*255,textData.fc[1]*255,textData.fc[2]*255)
			},
			{
				key: 'text-anchor',
				value: getTextAnchor(textData.j) 
			},
			{
				key: 'letter-spacing',
				value: textData.tr/1000*textData.s
			}
		];
		var textName = groupName + naming.TEXT_NAME;
		var text = node.createNodeWithAttributes('text', attributes, textName);
		var textLines = textData.t.split('\r');
		var i, len = textLines.length;
		var tSpanAttributes;
		for (i = 0; i < len; i += 1) {
			tSpanAttributes = [
				{
					key: 'x',
					value: '0'
				},
				{
					key: 'dy',
					value: i === 0 ? '0' : textData.lh
				}
			]
			var textSpan = node.createNodeWithAttributes('tspan', tSpanAttributes, textName + naming.TEXT_SPAN_NAME + '_' + i);
			node.nestChild(textSpan, textLines[i]);
			node.nestChild(text, textSpan);
		}
		node.nestChild(grouper, text);
	}

	function processData() {
	}

	var factoryInstance = {
		processData: processData,
		createNodeInstance: createNodeInstance
	};
	Object.assign(factoryInstance, layer(state)); 
	
	return factoryInstance;
}

module.exports = shape;
},{"../../helpers/fonts":3,"../../helpers/rgbToHex":4,"../../naming":16,"../../node":17,"../layer":9}],15:[function(require,module,exports){
var node = require ('../node');
var naming = require ('../naming');
var createTransformGroup = require ('../helpers/transform/createTransformGroup');

function transformer(state) {
	var transforms = [];

	function transform(transformData) {
		transforms.push(transformData);
	}

	function setSiblings(_siblings) {
		state.siblings = _siblings;
	}

	function getLayerDataByIndex(index) {
		var siblings = state.siblings;
		var i = 0, len = siblings.length;
		while( i < len) {
			if(siblings[i].ind === index) {
				return siblings[i];
			}
			i += 1;
		}
	}

	function buildParenting(parent, group, name, useContainerFlag) {
		if(parent !== undefined) {
			name = name + naming.PARENT_NAME + '_' + parent;
			//var parentGroup = node.createNode('group', name);

			var parentData = getLayerDataByIndex(parent);
			var nestedArray;
			if (useContainerFlag) {
				nestedArray = createTransformGroup(name, JSON.parse(JSON.stringify(parentData.ks)), state.timeOffset, state.frameRate, group);
			} else {
				nestedArray = [group].concat(createTransformGroup(name, JSON.parse(JSON.stringify(parentData.ks)), state.timeOffset, state.frameRate, null));
			}
			var containerParentGroup = node.nestArray(nestedArray);
			containerParentGroup = buildParenting(parentData.parent, containerParentGroup, name, false);

			return containerParentGroup;
		}
		return group;
	}

	return {
		transform: transform,
		buildParenting: buildParenting,
		setSiblings: setSiblings
	}
}

module.exports = transformer;
},{"../helpers/transform/createTransformGroup":6,"../naming":16,"../node":17}],16:[function(require,module,exports){
var config = require('./config')

var long_naming = {
	GROUP_NAME: '_GROUP',
	TRANSFORM_NAME: '_TRANSFORM',
	LAYER_NAME: '_LAYER',
	DRAWABLE_NAME: '_DRAWABLE',
	PATH_NAME: '_PATH',
	ROOT_NAME: '_ROOT',
	PARENT_NAME: '_PARENT',
	CLIP_NAME: '_CLIP',
	SOLID_NAME: '_SOLID',
	TIME_NAME: '_TIME',
	TEXT_NAME: '_TEXT',
	TEXT_SPAN_NAME: '_TEXT_SPAN'
}
var short_naming = {
	GROUP_NAME: '_G',
	TRANSFORM_NAME: '_T',
	LAYER_NAME: '_L',
	DRAWABLE_NAME: '_D',
	PATH_NAME: '_P',
	ROOT_NAME: '_R',
	PARENT_NAME: '_N',
	CLIP_NAME: '_C',
	SOLID_NAME: '_S',
	TIME_NAME: '_M',
	TEXT_NAME: '_X',
	TEXT_SPAN_NAME: '_A'
}

var naming = config.naming === 'short' ? short_naming : long_naming

module.exports = naming
},{"./config":2}],17:[function(require,module,exports){
 function createNodeWithAttributes(tagName, attributes, name) {
 	var node = createNode(tagName, name);
 	var i, len = attributes.length;
 	for(i = 0; i < len; i += 1) {
 		addAttribute(node, attributes[i].key, attributes[i].value);
 	}
 	return node;
 }

 function isArray(element) {
 	var what = Object.prototype.toString;
 	return what.call(element)  === '[object Array]';
 }

 function createNode(tagName, name) {
 	var node = {};
 	Object.defineProperty(node, tagName, {
	  value: { _attr: {} },
	  writable: true,
	  enumerable: true,
	  configurable: true
	});
 	if(name) {
 		addAttribute(node, 'id', name);
 	}
 	return node; 
 }

 function addAttribute(object, key, value) {
 	var tagName = getTagName(object);
 	var children = getChildren(object);
 	if(isArray(children)){
 		var i = 0, len = children.length;
	 	var attrsContainer;
	 	while(i < len) {
	 		if(children[i]._attr) {
	 			attrsContainer = children[i];
	 			break;
	 		}		
	 		i += 1;
	 	}
	 } else {
	 	attrsContainer = children;
	 }
 	
 	if (!attrsContainer) {
 		attrsContainer = {_attr:{}};
 		object[tagName] = attrsContainer;
 	}
 	attrsContainer._attr[key] = value;
 }

 function getTagName(nodeElem) {
 	var keys = Object.keys(nodeElem);
 	return keys[0];
 }

 function getAttribute(nodeElem, key) {
 	var children = getChildren(nodeElem);
 	if(isArray(children)){
	 	var i =0, len = children.length;
	 	while(i < len) {
	 		if(children[i]._attr && children[i]._attr[key]) {
	 			return children[i]._attr[key];
	 		}
	 		i += 1;
	 	}
	} else if(children._attr && children._attr[key]) {
		return children._attr[key];
	}
 	return '';
 }

function getChildren(nodeElem) {
 	var nodeTagName = getTagName(nodeElem);
 	var children = nodeElem[nodeTagName];
 	return children;
}

 function getChild(nodeElem, childName) {
 	var children = getChildren(nodeElem);
 	if(isArray(children)){
	 	var i =0, len = children.length, tagName;
	 	while(i < len) {
	 		tagName = getTagName(children[i]);
	 		if(tagName === childName) {
	 			return children[i];
	 		}
	 		i += 1;
	 	}
	}
	return '';
 }

 function nestChild(nodeElem, nested) {
 	if(!nested) {
 		return;
 	}
 	var tagName = getTagName(nodeElem);
 	if(!isArray(nodeElem[tagName])){
 		var attrs = nodeElem[tagName];
 		nodeElem[tagName] = [attrs];
 	}
 	nodeElem[tagName].push(nested);
 }

 function cloneNode(node, targets, suffix) {
 	var cloningNode = JSON.parse(JSON.stringify(node));
 	renameNode(cloningNode, targets, suffix);
 	return cloningNode;
 }

 function renameNode(nodeElem, targets, suffix) {
 	var children = getChildren(nodeElem);
 	if(children && isArray(children)) {
	 	var i, len = children.length;
	 	for( i = 0; i < len; i += 1) {
	 		renameNode(children[i], targets, suffix);
	 	}
 	}
 	var androidName = getAttribute(nodeElem, 'id');
 	if(androidName) {
 		duplicateTargets(targets, androidName, androidName + suffix);
 		addAttribute(nodeElem, 'id', androidName + suffix);
 	}
 }

 function duplicateTargets(targets, name, newName) {
 	var i, len = targets.length, newTarget;
 	for( i = 0 ; i < len; i += 1) {
 		if(targets[i].target[0]._attr['id'] === name) {
 			newTarget = JSON.parse(JSON.stringify(targets[i]));
 			newTarget.target[0]._attr['id'] = newName;
 			targets.push(newTarget);
 		}
 	}
 }

 function nestArray(array) {
 	var i, len = array.length;
 	for(i = 1; i < len; i += 1) {
 		nestChild(array[i],array[i - 1]);
 	}
 	return array[array.length - 1];
 }

 function getLastLeaves(node) {
 	var leaves = [];
 	var children = getChildren(node);
 	var hasChildren = false;
 	if(children && isArray(children)) {
 		var i, len = children.length, tagName;
 		for(i = 0; i < len; i += 1) {
 			tagName = getTagName(children[i]);
 			if (tagName !== '_attr') {
 				hasChildren = true;
 				leaves = leaves.concat(getLastLeaves(children[i]));
 			}
 		}
 	}
 	if(!hasChildren) {
 		leaves.push(node);
 	}
 	return leaves;
 }

 module.exports = {
 	createNode: createNode,
 	createNodeWithAttributes: createNodeWithAttributes,
 	addAttribute: addAttribute,
 	getTagName: getTagName,
 	getAttribute: getAttribute,
 	nestChild: nestChild,
 	nestArray: nestArray,
 	getChild: getChild,
 	getChildren: getChildren,
 	getLastLeaves: getLastLeaves,
 	cloneNode: cloneNode
 }
},{}],18:[function(require,module,exports){
var Matrix = require('transformatrix');

var _matrix = new Matrix();

function createPathData(data, matrix) {
	if(!matrix) {
		matrix = _matrix;
	}
	var i, len = data.v.length;
	var pathValue = '';
	var pt;
	for( i = 0; i < len - 1; i += 1) {
		if(i === 0) {
			pt = matrix.transformPoint(data.v[0][0], data.v[0][1]);
			pathValue += 'M' + roundValue(pt[0]) + ' ' + roundValue(pt[1]);
		}
		pt = matrix.transformPoint(data.o[i][0] + data.v[i][0], data.o[i][1] + data.v[i][1]);
		pathValue += ' C' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
		pt = matrix.transformPoint(data.i[i + 1][0] + data.v[i + 1][0], data.i[i + 1][1] + data.v[i + 1][1]);
		pathValue += ' ' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
		pt = matrix.transformPoint(data.v[i + 1][0], data.v[i + 1][1]);
		pathValue += ' ' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
	}
	if(data.c) {
		pt = matrix.transformPoint(data.o[i][0] + data.v[i][0], data.o[i][1] + data.v[i][1]);
		pathValue += ' C' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
		pt = matrix.transformPoint(data.i[0][0] + data.v[0][0], data.i[0][1] + data.v[0][1]);
		pathValue += ' ' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
		pt = matrix.transformPoint(data.v[0][0], data.v[0][1]);
		pathValue += ' ' + roundValue(pt[0]) + ',' + roundValue(pt[1]);
		pathValue += 'z';
	}
	pathValue += ' ';
	return pathValue;
}

function roundValue(val) {
	return Math.round(val*100)/100;
}

module.exports = createPathData;
},{"transformatrix":22}],19:[function(require,module,exports){
var node = require('./node');
var createPathData = require('./pathData');
var rgbHex = require('./helpers/rgbToHex');
var Matrix = require('transformatrix');
var timing = require('./helpers/timing');

var _matrix = new Matrix();
var frameRate = 0;
var timeCap = Number.MAX_SAFE_INTEGER;

function createAnimatedPropertyFromStaticValue(targetName, propertyType, property, timeOffset) {
	var keyframes = [
		{
			s: property,
			e: property,
			t: 0,
			o:{
			},
			i:{
			}
		},
		{
			t: timeCap
		}
	]
	keyframes[0].o.x = propertyType === 'scale' ? [0,0] : 0
	keyframes[0].o.y = propertyType === 'scale' ? [0,0] : 0
	keyframes[0].i.x = propertyType === 'scale' ? [1,1] : 1
	keyframes[0].i.y = propertyType === 'scale' ? [1,1] : 1
	return createAnimatedProperty(targetName, propertyType, keyframes, timeOffset);
}

function createAnimatedProperty(targetName, propertyType, keyframes, timeOffset) {
	if(keyframes[0].t > 0) {
		var extraKeyframe = JSON.parse(JSON.stringify(keyframes[0]));
		extraKeyframe.e = extraKeyframe.s;
		extraKeyframe.t = 0;
		if(extraKeyframe.to){
			extraKeyframe.to = [0,0];
			extraKeyframe.ti = [0,0];
		}
		keyframes.splice(0,0,extraKeyframe);
	}
	var objectAnimator, multiplier;
	var index, multiplier, interpolationType, propertyName;
	if(propertyType === 'position' || propertyType === '-position') {
		if (keyframes[0].to && propertyType === 'position') {
			objectAnimator = createAnimatorObject(keyframes, 'translate', {type:'combined', interpolationType:'unidimensional', timeOffset: timeOffset}, targetName);
		} else {
			multiplier = propertyType === '-position' ? -0.5 : 1;
			interpolationType = propertyType === '-position' ? 'multidimensional' : 'multidimensional';
			objectAnimator = createAnimatorObject(keyframes, 'translate', {type:'multidimensional', interpolationType: interpolationType, multiplier:multiplier, timeOffset: timeOffset}, targetName);
			//objectAnimator = createAnimatorObject(keyframes[i - 1], keyframes[i], 'translateX', {type:'multidimensional', index:0, interpolationType:'unidimensional', timeOffset: timeOffset});
			//objectAnimator = createAnimatorObject(keyframes[i - 1], keyframes[i], 'translateY', {type:'multidimensional', index:1, interpolationType:'unidimensional', timeOffset: timeOffset});
		}
		
	} else if(propertyType === 'positionX' || propertyType === 'positionY') {
		propertyName = propertyType === 'positionX' ? 'translateX' : 'translateY';
		objectAnimator = createAnimatorObject(keyframes[i - 1], keyframes[i], propertyName, {type:'unidimensional', interpolationType:'unidimensional', timeOffset: timeOffset});
		
	} else if(propertyType === '-anchor' || propertyType === 'anchor') {
		multiplier = propertyType === '-anchor' ? -1 : 1;
		objectAnimator = createAnimatorObject(keyframes, 'translate', {type:'multidimensional', interpolationType:'unidimensional', multiplier:multiplier, timeOffset: timeOffset}, targetName);
	} else if(propertyType === 'scale') {
		objectAnimator = createAnimatorObject(keyframes, 'scale', {type:'multidimensional', interpolationType:'multidimensional', multiplier:0.01, timeOffset: timeOffset}, targetName);
	} else if(propertyType === 'scaleX' || propertyType === 'scaleY') {
		index = propertyType === 'scaleX' ? 0 : 1;
		objectAnimator = createAnimatorObject(keyframes, propertyType, {type:'multidimensional', index:index, interpolationType:'multidimensional', multiplier:0.01, timeOffset: timeOffset});
	} else if(propertyType === 'rotate' || propertyType === 'strokeWidth') {
		objectAnimator = createAnimatorObject(keyframes, propertyType, {type:'unidimensional', interpolationType:'unidimensional', timeOffset: timeOffset}, targetName);
	}else if(propertyType === 'fillColor' || propertyType === 'strokeColor') {
		objectAnimator = createAnimatorObject(keyframes, propertyType, {type:'color', interpolationType:'unidimensional', timeOffset: timeOffset}, targetName);
	} else if(propertyType === 'strokeAlpha' || propertyType === 'fillAlpha' || propertyType === 'trimPathEnd' || propertyType === 'trimPathStart' || propertyType === 'trimPathOffset' || propertyType === 'opacity' || propertyType === 'rx' || propertyType === 'ry') {
		switch(propertyType) {
			case 'trimPathOffset':
				multiplier = 1/360;
				break;
			case 'rx':
			case 'ry':
				multiplier = 1;
				break;
			default:
				multiplier = 0.01;
				break;
		}
		objectAnimator = createAnimatorObject(keyframes, propertyType, {type:'unidimensional', interpolationType:'unidimensional', multiplier:multiplier, timeOffset: timeOffset}, targetName);
	} else if(propertyType === 'rectPositionX' || propertyType === 'ellipsePositionX') {
		propertyName = propertyType === 'rectPositionX' ? 'x' : 'cx';
		objectAnimator = createAnimatorObject(keyframes, propertyName, {type:'unidimensional', interpolationType:'unidimensional', timeOffset: timeOffset, index:0}, targetName);
	} else if(propertyType === 'rectPositionY' || propertyType === 'ellipsePositionY') {
		propertyName = propertyType === 'rectPositionY' ? 'y' : 'cy';
		objectAnimator = createAnimatorObject(keyframes, propertyName, {type:'unidimensional', interpolationType:'unidimensional', timeOffset: timeOffset, index:1}, targetName);
	} else if(propertyType === 'rectWidth' || propertyType === 'ellipseWidth') {
		propertyName = propertyType === 'rectWidth' ? 'width' : 'rx';
		objectAnimator = createAnimatorObject(keyframes, propertyName, {type:'unidimensional', interpolationType:'multidimensional', timeOffset: timeOffset, index:0}, targetName);
	} else if(propertyType === 'rectHeight' || propertyType === 'ellipseHeight') {
		propertyName = propertyType === 'rectHeight' ? 'height' : 'ry';
		objectAnimator = createAnimatorObject(keyframes, propertyName, {type:'unidimensional', interpolationType:'multidimensional', timeOffset: timeOffset, index:1}, targetName);
	}
	return objectAnimator;
}

function createAnimatedPathData(targetName, keyframes, matrix, staticPath, timeOffset) {
	var objectAnimator = createAnimatorObject(keyframes, 'd', {type:'path', interpolationType:'unidimensional', timeOffset: timeOffset, matrix: matrix, staticPath: staticPath}, targetName);
	return objectAnimator;
}

function createSetNode() {
	var attributes = [{
		key: 'android:ordering',
		value: 'together'
	}];
	return node.createNodeWithAttributes('set', attributes, '');
}

function createAAPTAnimation() {
	var attributes = [{
		key: 'name',
		value: 'android:animation'
	}];
	return node.createNodeWithAttributes('aapt:attr', attributes, '');
}

function createTargetNode(nodeName) {
 	var attributes = [{
 		key: 'id',
 		value: nodeName
 	}];
 	return node.createNodeWithAttributes('target', attributes, '');
}

function resetMotionPath(keyframe) {
	keyframe.to = [0,0];
	keyframe.ti = [0,0];
}

function createControlPoints(keyframe, interpolationType) {
	if(interpolationType === 'multidimensional') {
		keyframe.o = {
			x:[0,0],
			y:[0,0]
		}
		keyframe.i = {
			x:[0,0],
			y:[0,0]
		}
	} else {
		keyframe.o = {
			x:0,
			y:0
		}
		keyframe.i = {
			x:0,
			y:0
		}
	}
}

function formatKeyframes(keyframes, options) {
	var animationDurationInFrames = timing.getDuration('frames');
	if(options.timeOffset) {
		var i, len = keyframes.length;
		for(i=0;i<len;i+=1){
			keyframes[i].t += options.timeOffset;
		}
	}
	var initialValue = keyframes[0];
	var hasMotionPath = !!keyframes[0].to;
	var finalValue, beforeLastFinalValue;
	//Removing keyframes previous to the zero value.
	//Check if it's better to set a negative begin time.
	while(initialValue.t < 0){
		keyframes.shift();
		initialValue = keyframes[0];
	}
	//Adding a keyframe at zero position.
	if(initialValue.t > 0) {
		var zeroKeyframe = JSON.parse(JSON.stringify(initialValue));
		zeroKeyframe.t = 0;
		if(hasMotionPath) {
			resetMotionPath(zeroKeyframe);
		}
		keyframes.splice(0,0,zeroKeyframe);
	}
	var totalKeyframes = keyframes.length;
	finalValue = keyframes[totalKeyframes - 1];
	while(finalValue.t > animationDurationInFrames) {
		keyframes.pop();
		totalKeyframes -= 1;
		finalValue = keyframes[totalKeyframes - 1];
	}
	beforeLastFinalValue = keyframes[totalKeyframes - 2];
	finalValue.s = beforeLastFinalValue.h === 1 ? beforeLastFinalValue.s : beforeLastFinalValue.e;
	finalValue.e = finalValue.s;
	if(hasMotionPath) {
		resetMotionPath(finalValue);
	}
	createControlPoints(finalValue, options.interpolationType)
	if(finalValue.t < animationDurationInFrames) {
 		var newKeyframe = JSON.parse(JSON.stringify(finalValue));
 		newKeyframe.t = animationDurationInFrames;
 		keyframes.push(newKeyframe);
 	}
	return keyframes;
}

 function createAnimatorObject(keyframes, propertyName, options, targetName) {
 	var animationDurationInFrames = timing.getDuration('frames');

 	options.multiplier = options.multiplier || 1;
 	options.timeOffset = options.timeOffset || 0;
 	options.matrix = options.matrix || _matrix.reset();
 	options.staticPath = options.staticPath || '';
 	keyframes = formatKeyframes(keyframes, options);
 	var totalKeyframes = keyframes.length;
 	var initialValue = keyframes[0];
 	var beforeLastFinalValue = keyframes[totalKeyframes - 2];
 	var finalValue = keyframes[totalKeyframes - 1];
 	var duration = finalValue.t - initialValue.t;


 	var startOffset = initialValue.t + options.timeOffset;
 	var hasMotionPath = keyframes[0].to && options.type === 'combined';
 	var attributeName = '';
 	switch(propertyName) {
 		case 'translate':
 		case 'rotate':
 		case 'scale':
 			attributeName = 'transform'
 			break
 		case 'fillColor':
 			attributeName = 'fill'
 			break
 		case 'fillAlpha':
 			attributeName = 'fill-opacity'
 			break
 		case 'strokeColor':
 			attributeName = 'stroke'
 			break
 		case 'strokeAlpha':
 			attributeName = 'stroke-opacity'
 			break
 		case 'strokeWidth':
 			attributeName = 'stroke-width'
 			break
 		default:
 			attributeName = propertyName
 			break

 	}
 	var attributes = [
 	{
 		key: 'repeatCount',
 		value: 'indefinite'
 	},
 	{
 		key: 'dur',
 		value: animationDurationInFrames / frameRate + 's'
 	},
 	{
 		key: 'begin',
 		value: '0s'
 	},
 	{
 		key: 'xlink:href',
 		value: '#' + targetName
 	},
 	{
 		key: 'fill',
 		value: 'freeze'
 	}];
 	if(!hasMotionPath) {
		attributes.push({
	 		key: 'attributeName',
	 		value: attributeName
	 	})
 	}
 	if (attributeName === 'd' || attributeName === 'width' || attributeName === 'height') {
		attributes.push({
	 		key: 'attributeType',
	 		value: 'XML'
	 	})
 	}

 	if(hasMotionPath) {

 	} else if (options.type === 'multidimensional') {
 		attributes.push({
 			key: 'from',
 			value: initialValue.s[0] * options.multiplier + ' ' + initialValue.s[1] * options.multiplier
 		})

 		if(beforeLastFinalValue.h === 1) {
	 		attributes.push({
	 			key: 'to',
	 			value: beforeLastFinalValue.s[0] * options.multiplier + ' ' + beforeLastFinalValue.s[1] * options.multiplier
	 		})
 		} else {
	 		attributes.push({
	 			key: 'to',
	 			value: beforeLastFinalValue.e[0] * options.multiplier + ' ' + beforeLastFinalValue.e[1] * options.multiplier
	 		})
 		}
 	} else if (options.type === 'unidimensional') {
 		if(options.index !== undefined) {
			attributes.push({
	 			key: 'from',
	 			value: initialValue.s[options.index] * options.multiplier
	 		})
 		} else {
 			attributes.push({
	 			key: 'from',
	 			value: initialValue.s * options.multiplier
	 		})
 		}
 		
 		if(options.index !== undefined) {
 			if(beforeLastFinalValue.h === 1) {
				attributes.push({
		 			key: 'to',
		 			value: beforeLastFinalValue.s[options.index] * options.multiplier
		 		})
			} else {
				attributes.push({
		 			key: 'to',
		 			value: beforeLastFinalValue.e[options.index] * options.multiplier
		 		})
			}
 		} else {
 			if(initialValue.h === 1) {
		 		attributes.push({
		 			key: 'to',
		 			value: beforeLastFinalValue.s * options.multiplier
		 		})
	 		} else {
		 		attributes.push({
		 			key: 'to',
		 			value: beforeLastFinalValue.e * options.multiplier
		 		})
	 		}
 		}
 		
 	} else if (options.type === 'path') {
 		attributes.push({
 			key: 'from',
 			value: options.staticPath + createPathData(initialValue.s[0], options.matrix)
 		})
 		if(initialValue.h === 1) {
	 		attributes.push({
	 			key: 'to',
	 			value: options.staticPath + createPathData(beforeLastFinalValue.s[0], options.matrix)
	 		})
 		} else {
	 		attributes.push({
	 			key: 'to',
	 			value: options.staticPath + createPathData(beforeLastFinalValue.e[0], options.matrix)
	 		})
 		}
 	} else if (options.type === 'color') {
 		attributes.push({
 			key: 'from',
 			value: rgbHex(initialValue.s[0]*255, initialValue.s[1]*255, initialValue.s[2]*255)
 		})
 		if(initialValue.h === 1) {
	 		attributes.push({
	 			key: 'to',
	 			value: rgbHex(initialValue.s[0]*255, initialValue.s[1]*255, initialValue.s[2]*255)
	 		})
 		} else {
	 		attributes.push({
	 			key: 'to',
	 			value: rgbHex(initialValue.e[0]*255, initialValue.e[1]*255, initialValue.e[2]*255)
	 		})
 		}
 	} else if (options.type === 'combined') {
 		attributes.push({
 			key: 'from',
 			value: initialValue.s[0] + ' ' + initialValue.s[1]
 		})
 		attributes.push({
 			key: 'to',
 			value: keyframes[totalKeyframes - 2].e[0] + ' ' + keyframes[totalKeyframes - 2].e[1]
 		})
 		/*var pathValue = 'M ' + initialValue.s[0] + ',' + initialValue.s[1];
 		pathValue += 'C ' + (initialValue.s[0] + initialValue.to[0]) + ',' + (initialValue.s[1]  + initialValue.to[1]);
 		pathValue += ' ' + (initialValue.e[0] + initialValue.ti[0]) + ',' + (initialValue.e[1]  + initialValue.ti[1]);
 		pathValue += ' ' + (initialValue.e[0]) + ',' + (initialValue.e[1]);
 		attributes.push({
 			key: 'android:pathData',
 			value: pathValue
 		})*/
 	}

 	if(!hasMotionPath && (propertyName === 'scale' || propertyName === 'translate' || propertyName === 'rotate')) {
 		attributes.push({
 			key: 'type',
 			value: propertyName
 		})
		attributes.push({
			key: 'additive',
			value: 'sum'
		})
 	}
 	var keyTimes = buildKeyTimes(keyframes);
	attributes.push({
		key: 'keyTimes',
		value: keyTimes
	})
	if(hasMotionPath) {
	 	var pathData = buildPath(keyframes);
		attributes.push({
			key: 'path',
			value: createPathData(pathData)
		})
	 	var keyPoints = buildKeyPoints(keyframes, pathData);
		attributes.push({
			key: 'keyPoints',
			value: keyPoints
		})
	} else {
	 	var keyValues = buildKeyValues(keyframes, options);
		attributes.push({
			key: 'values',
			value: keyValues
		})
	}

 	var keySplines = buildKeySplines(keyframes, options);
	attributes.push({
		key: 'keySplines',
		value: keySplines
	})
	attributes.push({
		key: 'calcMode',
		value: 'spline'
	})
 	var objectAnimatorNodeName = '';
 	switch(propertyName) {
 		case 'translate':
 		case 'scale':
 		case 'rotate':
 			objectAnimatorNodeName = hasMotionPath ? 'animateMotion' : 'animateTransform';
 			break;
 		default:
 			objectAnimatorNodeName = 'animate';
 			break;
 	}
 	var objectAnimator = node.createNodeWithAttributes(objectAnimatorNodeName, attributes, '');
 	return objectAnimator;
 }

 function buildPath(keyframes) {
 	var i, len = keyframes.length;
 	var pathDataArr = {
 		i:[],
 		v:[],
 		o:[],
 		c: false
 	}
 	for(i = 0;i < len - 1;i += 1) {
 		pathDataArr.v[i] = [keyframes[i].s[0],keyframes[i].s[1]];
 		pathDataArr.v[i+1] = [keyframes[i].e[0],keyframes[i].e[1]];
 		pathDataArr.o[i] = [keyframes[i].to[0],keyframes[i].to[1]];
 		pathDataArr.i[i+1] = [keyframes[i].ti[0],keyframes[i].ti[1]];
 	}
	pathDataArr.o[keyframes.length-1] = [0,0];
	pathDataArr.i[0] = [0,0];

 	return pathDataArr;

 }

 function buildKeyPoints(keyframes, pathData) {
 	var totalLength = 0;
 	var lengths = [];
 	var i, len = keyframes.length;
 	var totalLength = 0;
 	var pathLength;
 	for(i = 0; i < len - 1; i += 1) {
 		pathLength = getCurveLength(pathData.v[i], pathData.v[i+1], pathData.o[i], pathData.i[i + 1]);
 		lengths.push(pathLength)
 		totalLength += pathLength;
 	}
 	var keyPoints = '0', len = lengths.length;
 	var accumulatedLength = 0;
 	for(i = 0; i < len - 1; i += 1) {
 		accumulatedLength += lengths[i];
 		keyPoints += ';';
 		keyPoints += Math.round(100*accumulatedLength/totalLength)/100;
 	}
 	keyPoints += ';1';
 	return keyPoints; 
 }

 function getCurveLength(initPos, endPos, outBezier, inBezier) {
    var k, curveSegments = 200, point, lastPoint = null, ptDistance, absToCoord, absTiCoord, triCoord1, triCoord2, triCoord3, liCoord1, liCoord2, ptCoord, perc, addedLength = 0, i, len;
    for (k = 0; k < curveSegments; k += 1) {
        point = [];
        perc = k / (curveSegments - 1);
        ptDistance = 0;
        absToCoord = [];
        absTiCoord = [];
        len = outBezier.length;
        for (i = 0; i < len; i += 1) {
            if (absToCoord[i] === null || absToCoord[i] === undefined) {
                absToCoord[i] = initPos[i] + outBezier[i];
                absTiCoord[i] = endPos[i] + inBezier[i];
            }
            triCoord1 = initPos[i] + (absToCoord[i] - initPos[i]) * perc;
            triCoord2 = absToCoord[i] + (absTiCoord[i] - absToCoord[i]) * perc;
            triCoord3 = absTiCoord[i] + (endPos[i] - absTiCoord[i]) * perc;
            liCoord1 = triCoord1 + (triCoord2 - triCoord1) * perc;
            liCoord2 = triCoord2 + (triCoord3 - triCoord2) * perc;
            ptCoord = liCoord1 + (liCoord2 - liCoord1) * perc;
            point.push(ptCoord);
            if (lastPoint !== null) {
                ptDistance += Math.pow(point[i] - lastPoint[i], 2);
            }
        }
        ptDistance = Math.sqrt(ptDistance);
        addedLength += ptDistance;
        lastPoint = point;
    }
    return addedLength;
}

 function buildKeyValues(keyframes, options) {
 	var multiplier = options.multiplier
 	var dimensions = options.type
	var i, len = keyframes.length;
	var keyValues = '';
	for( i = 0; i < len; i += 1) {
		keyValues += keyValues === '' ? '':';'
		if(dimensions === 'multidimensional' || dimensions === 'combined') {
			keyValues += (i === len - 1) ? keyframes[i-1].e[0] * multiplier + ' ' + keyframes[i-1].e[1] * multiplier : keyframes[i].s[0] * multiplier + ' ' + keyframes[i].s[1] * multiplier
		} else if (dimensions === 'path') {
			var staticPath = options.staticPath
			var matrix = options.matrix
			keyValues += staticPath
			keyValues += (i === len - 1 && keyframes[i-1].h !== 1) ? createPathData(keyframes[i-1].e[0], matrix) : createPathData(keyframes[i].s[0], matrix)
		} else if (dimensions === 'color') {
			keyValues += (i === len - 1) ? rgbHex(keyframes[i-1].e[0]*255, keyframes[i-1].e[1]*255, keyframes[i-1].e[2]*255) : rgbHex(keyframes[i].s[0]*255, keyframes[i].s[1]*255, keyframes[i].s[2]*255)
		} else {
			if(options.index !== undefined) {
				keyValues += (i === len - 1) ? keyframes[i-1].e[options.index] * multiplier : keyframes[i].s[options.index] * multiplier
			} else {
				keyValues += (i === len - 1) ? keyframes[i-1].e * multiplier : keyframes[i].s * multiplier
			}
		}
	}
	return keyValues;
 }

 function buildKeyTimes(keyframes) {
	var i, len = keyframes.length;
	var keyTimes = '';
	var duration = keyframes[len - 1].t - keyframes[0].t; 
	for( i = 0; i < len; i += 1) {
		keyTimes += keyTimes === '' ? '':';'
		keyTimes += Math.round(10000000*(keyframes[i].t - keyframes[0].t)/duration)/10000000;
	}
	return keyTimes;
 }

 function buildKeySplines(keyframes, options) {
 	var i, len = keyframes.length;
	var keySplines = '';
 	var interpolationType = options.interpolationType;
	for( i = 0; i < len - 1; i += 1) {
		keySplines += keySplines === '' ? '':';'
		if(keyframes[i].h === 1) {
			keySplines += '0 0 1 1';
		} else if(interpolationType === 'multidimensional') {
			keySplines += keyframes[i].o.x[0] + ' ';
			keySplines += keyframes[i].o.y[0] + ' ';
			keySplines += keyframes[i].i.x[0] + ' ';
			keySplines += keyframes[i].i.y[0];
		} else {
			keySplines += keyframes[i].o.x + ' ';
			keySplines += keyframes[i].o.y + ' ';
			keySplines += keyframes[i].i.x + ' ';
			keySplines += keyframes[i].i.y;
		}
	}
 	return keySplines;
 }

function setFrameRate(_frameRate) {
	frameRate = _frameRate;
}

function setTimeCap(_timeCap) {
	timeCap = _timeCap;
}

function getTimeCap() {
	return timeCap;
}

 module.exports = {
 	createAnimatedProperty: createAnimatedProperty,
 	createAnimatedPropertyFromStaticValue: createAnimatedPropertyFromStaticValue,
 	createAnimatedPathData: createAnimatedPathData,
 	createAnimatorObject: createAnimatorObject,
 	createAAPTAnimation: createAAPTAnimation,
 	createTargetNode: createTargetNode,
 	createSetNode: createSetNode,
 	setFrameRate: setFrameRate,
 	setTimeCap: setTimeCap,
 	getTimeCap: getTimeCap
 }
},{"./helpers/rgbToHex":4,"./helpers/timing":5,"./node":17,"./pathData":18,"transformatrix":22}],20:[function(require,module,exports){
var compositionFactory = require ('../layers/composition');
var node = require ('../node');
var naming = require ('../naming');
var property = require ('../property');
var targets = require ('../targets/targets');
var fonts = require('../helpers/fonts');
var timing = require('../helpers/timing');

function svg(_animationData) {

	var attributes = [{
		key: 'xmlns',
		value: 'http://www.w3.org/2000/svg'
	},
	{
		key: 'xmlns:xlink',
		value: 'http://www.w3.org/1999/xlink'
	}];

	var _composition, animationData;

	function createTimeRangeObject() {
		var name = 'time_group';
		var timeNode = node.createNode('g',name);
		var attributes = [{
			key: 'attributeType',
			value: 'XML'
		},
		{
			key: 'attributeName',
			value: 'opacity'
		},
		{
			key: 'dur',
			value: Math.round((animationData.op - animationData.ip)/animationData.fr) + 's'
		},
		{
			key: 'from',
			value: '0'
		},
		{
			key: 'to',
			value: '1'
		},
		{
			key: 'xlink:href',
			value: '#' + name
		}];
 		var objectAnimator = node.createNodeWithAttributes('animate', attributes, '');
		targets.addTarget(objectAnimator);
		return timeNode;
	}
	
	function addSizeAttributes(width, height) {
		var sizeAttributes = [
			{
				key: 'preserveAspectRatio',
				value: 'xMidYMid meet'
			},
			{
				key: 'width',
				value: width
			},
			{
				key: 'height',
				value: height
			},
			{
				key: 'viewBox',
				value: '0 0 ' + width + ' ' + height
			},
			{
				key: 'style',
				value: 'width:100%;height:100%'
			}
		]
		return sizeAttributes;
	}

	function exportNode() {
		var promise = new Promise(function(resolve, reject){
			targets.resetTargets();
			var svgAttributes = attributes.concat(addSizeAttributes(animationData.w, animationData.h));
			var svgElem = node.createNodeWithAttributes('svg', svgAttributes);
			node.nestChild(svgElem, _composition.exportNode(naming.ROOT_NAME));
			node.nestChild(svgElem, createTimeRangeObject())
			targets.buildTargets(svgElem);
			resolve(svgElem);
		})
		return promise;
	}

	function createTargets() {
		var targets = [];
		_composition.createTargets(targets);
	}

	function processAnimation(_animationData) {
		var promise = new Promise(function(resolve, reject){
			animationData = _animationData;
			if(animationData.fonts) {
				fonts.addFonts(animationData.fonts.list);
			}
			timing.setTime(animationData.ip, animationData.op, animationData.fr)
			property.setFrameRate(animationData.fr);
			property.setTimeCap(animationData.op);
			_composition = compositionFactory(_animationData, _animationData.assets)
			.setTimeOffset(-_animationData.ip)
			.setWorkAreaOffset(_animationData.ip)
			.processData();
			resolve();
		})
		return promise;
	}

	return  {
		exportNode: exportNode,
		createTargets: createTargets,
		processAnimation: processAnimation
	}
}

module.exports = svg;
},{"../helpers/fonts":3,"../helpers/timing":5,"../layers/composition":8,"../naming":16,"../node":17,"../property":19,"../targets/targets":21}],21:[function(require,module,exports){
var node = require ('../node');
var _targets = [];

function resetTargets(){
	_targets.length = 0;
}

function addTarget(target){
	var firstLeave = node.getLastLeaves(target)[0];
	if (node.getTagName(firstLeave) === 'set') {
		return;
	}
	_targets.push(target);
}

function getTargetByNameAndProperty(name, property) {
	var i = 0, len = _targets.length;
	while(i < len) {
		if(node.getAttribute(_targets[i], 'id') === name) {
			var aapt_attr = node.getChild(_targets[i], 'aapt:attr');
			var set = node.getChild(aapt_attr, 'set');
			var objectAnimator = node.getChild(set, 'objectAnimator');
			if(node.getAttribute(objectAnimator, 'android:propertyName') === property) {
				return _targets[i];
			}
		}
		i += 1;
	}
	return null;
}

function buildTargets(avd) {
	var defs = node.createNode('defs');
	var target;
	var i, len = _targets.length;
	for(i = 0; i < len; i += 1) {
		target = _targets[i];
		node.nestChild(defs, target);
	} 
	node.nestChild(avd, defs);
}

module.exports = {
	resetTargets: resetTargets,
	addTarget: addTarget,
	getTargetByNameAndProperty: getTargetByNameAndProperty,
	buildTargets: buildTargets
};
},{"../node":17}],22:[function(require,module,exports){
var Matrix = function() {
    this.reset();
};
Matrix.prototype.reset = function() {
    this.m = [1, 0, 0, 1, 0, 0];
    return this;
};
Matrix.prototype.multiply = function(matrix) {
    var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1],
        m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1],
        m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3],
        m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

    var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4],
        dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    this.m[4] = dx;
    this.m[5] = dy;
    return this;
};
Matrix.prototype.inverse = function() {
    var inv = new Matrix();
    inv.m = this.m.slice(0);
    var d = 1 / (inv.m[0] * inv.m[3] - inv.m[1] * inv.m[2]),
        m0 = inv.m[3] * d,
        m1 = -inv.m[1] * d,
        m2 = -inv.m[2] * d,
        m3 = inv.m[0] * d,
        m4 = d * (inv.m[2] * inv.m[5] - inv.m[3] * inv.m[4]),
        m5 = d * (inv.m[1] * inv.m[4] - inv.m[0] * inv.m[5]);
    inv.m[0] = m0;
    inv.m[1] = m1;
    inv.m[2] = m2;
    inv.m[3] = m3;
    inv.m[4] = m4;
    inv.m[5] = m5;
    return inv;
};
Matrix.prototype.rotate = function(rad) {
    var c = Math.cos(rad),
        s = Math.sin(rad),
        m11 = this.m[0] * c + this.m[2] * s,
        m12 = this.m[1] * c + this.m[3] * s,
        m21 = this.m[0] * -s + this.m[2] * c,
        m22 = this.m[1] * -s + this.m[3] * c;
    this.m[0] = m11;
    this.m[1] = m12;
    this.m[2] = m21;
    this.m[3] = m22;
    return this;
};
Matrix.prototype.translate = function(x, y) {
    this.m[4] += this.m[0] * x + this.m[2] * y;
    this.m[5] += this.m[1] * x + this.m[3] * y;
    return this;
};
Matrix.prototype.scale = function(sx, sy) {
    this.m[0] *= sx;
    this.m[1] *= sx;
    this.m[2] *= sy;
    this.m[3] *= sy;
    return this;
};
Matrix.prototype.transformPoint = function(px, py) {
    var x = px,
        y = py;
    px = x * this.m[0] + y * this.m[2] + this.m[4];
    py = x * this.m[1] + y * this.m[3] + this.m[5];
    return [px, py];
};
Matrix.prototype.transformVector = function(px, py) {
    var x = px,
        y = py;
    px = x * this.m[0] + y * this.m[2];
    py = x * this.m[1] + y * this.m[3];
    return [px, py];
};
if(typeof module !== "undefined") {
    module.exports = Matrix;
}
else {
    window.Matrix = Matrix;
}

},{}],23:[function(require,module,exports){

var XML_CHARACTER_MAP = {
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    '<': '&lt;',
    '>': '&gt;'
};

function escapeForXML(string) {
    return string && string.replace
        ? string.replace(/([&"<>'])/g, function(str, item) {
            return XML_CHARACTER_MAP[item];
          })
        : string;
}

module.exports = escapeForXML;

},{}],24:[function(require,module,exports){
(function (process){
var escapeForXML = require('./escapeForXML');
var Stream = require('stream').Stream;

var DEFAULT_INDENT = '    ';

function xml(input, options) {

    if (typeof options !== 'object') {
        options = {
            indent: options
        };
    }

    var stream      = options.stream ? new Stream() : null,
        output      = "",
        interrupted = false,
        indent      = !options.indent ? ''
                        : options.indent === true ? DEFAULT_INDENT
                            : options.indent,
        instant     = true;


    function delay (func) {
        if (!instant) {
            func();
        } else {
            process.nextTick(func);
        }
    }

    function append (interrupt, out) {
        if (out !== undefined) {
            output += out;
        }
        if (interrupt && !interrupted) {
            stream = stream || new Stream();
            interrupted = true;
        }
        if (interrupt && interrupted) {
            var data = output;
            delay(function () { stream.emit('data', data) });
            output = "";
        }
    }

    function add (value, last) {
        format(append, resolve(value, indent, indent ? 1 : 0), last);
    }

    function end() {
        if (stream) {
            var data = output;
            delay(function () {
              stream.emit('data', data);
              stream.emit('end');
              stream.readable = false;
              stream.emit('close');
            });
        }
    }

    function addXmlDeclaration(declaration) {
        var encoding = declaration.encoding || 'UTF-8',
            attr =  { version: '1.0', encoding: encoding };

        if (declaration.standalone) {
            attr.standalone = declaration.standalone
        }

        add({'?xml': { _attr: attr } });
        output = output.replace('/>', '?>');
    }

    // disable delay delayed
    delay(function () { instant = false });

    if (options.declaration) {
        addXmlDeclaration(options.declaration);
    }

    if (input && input.forEach) {
        input.forEach(function (value, i) {
            var last;
            if (i + 1 === input.length)
                last = end;
            add(value, last);
        });
    } else {
        add(input, end);
    }

    if (stream) {
        stream.readable = true;
        return stream;
    }
    return output;
}

function element (/*input, …*/) {
    var input = Array.prototype.slice.call(arguments),
        self = {
            _elem:  resolve(input)
        };

    self.push = function (input) {
        if (!this.append) {
            throw new Error("not assigned to a parent!");
        }
        var that = this;
        var indent = this._elem.indent;
        format(this.append, resolve(
            input, indent, this._elem.icount + (indent ? 1 : 0)),
            function () { that.append(true) });
    };

    self.close = function (input) {
        if (input !== undefined) {
            this.push(input);
        }
        if (this.end) {
            this.end();
        }
    };

    return self;
}

function create_indent(character, count) {
    return (new Array(count || 0).join(character || ''))
}

function resolve(data, indent, indent_count) {
    indent_count = indent_count || 0;
    var indent_spaces = create_indent(indent, indent_count);
    var name;
    var values = data;
    var interrupt = false;

    if (typeof data === 'object') {
        var keys = Object.keys(data);
        name = keys[0];
        values = data[name];

        if (values && values._elem) {
            values._elem.name = name;
            values._elem.icount = indent_count;
            values._elem.indent = indent;
            values._elem.indents = indent_spaces;
            values._elem.interrupt = values;
            return values._elem;
        }
    }

    var attributes = [],
        content = [];

    var isStringContent;

    function get_attributes(obj){
        var keys = Object.keys(obj);
        keys.forEach(function(key){
            attributes.push(attribute(key, obj[key]));
        });
    }

    switch(typeof values) {
        case 'object':
            if (values === null) break;

            if (values._attr) {
                get_attributes(values._attr);
            }

            if (values._cdata) {
                content.push(
                    ('<![CDATA[' + values._cdata).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>'
                );
            }

            if (values.forEach) {
                isStringContent = false;
                content.push('');
                values.forEach(function(value) {
                    if (typeof value == 'object') {
                        var _name = Object.keys(value)[0];

                        if (_name == '_attr') {
                            get_attributes(value._attr);
                        } else {
                            content.push(resolve(
                                value, indent, indent_count + 1));
                        }
                    } else {
                        //string
                        content.pop();
                        isStringContent=true;
                        content.push(escapeForXML(value));
                    }

                });
                if (!isStringContent) {
                    content.push('');
                }
            }
        break;

        default:
            //string
            content.push(escapeForXML(values));

    }

    return {
        name:       name,
        interrupt:  interrupt,
        attributes: attributes,
        content:    content,
        icount:     indent_count,
        indents:    indent_spaces,
        indent:     indent
    };
}

function format(append, elem, end) {

    if (typeof elem != 'object') {
        return append(false, elem);
    }

    var len = elem.interrupt ? 1 : elem.content.length;

    function proceed () {
        while (elem.content.length) {
            var value = elem.content.shift();

            if (value === undefined) continue;
            if (interrupt(value)) return;

            format(append, value);
        }

        append(false, (len > 1 ? elem.indents : '')
            + (elem.name ? '</' + elem.name + '>' : '')
            + (elem.indent && !end ? '\n' : ''));

        if (end) {
            end();
        }
    }

    function interrupt(value) {
       if (value.interrupt) {
           value.interrupt.append = append;
           value.interrupt.end = proceed;
           value.interrupt = false;
           append(true);
           return true;
       }
       return false;
    }

    append(false, elem.indents
        + (elem.name ? '<' + elem.name : '')
        + (elem.attributes.length ? ' ' + elem.attributes.join(' ') : '')
        + (len ? (elem.name ? '>' : '') : (elem.name ? '/>' : ''))
        + (elem.indent && len > 1 ? '\n' : ''));

    if (!len) {
        return append(false, elem.indent ? '\n' : '');
    }

    if (!interrupt(elem)) {
        proceed();
    }
}

function attribute(key, value) {
    return key + '=' + '"' + escapeForXML(value) + '"';
}

module.exports = xml;
module.exports.element = module.exports.Element = element;

}).call(this,require('_process'))
},{"./escapeForXML":23,"_process":36,"stream":51}],25:[function(require,module,exports){

},{}],26:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],27:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],28:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (ArrayBuffer.isView(buf)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":26,"ieee754":31}],29:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":33}],30:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],31:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],32:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],33:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],34:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],35:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":36}],36:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],37:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":38}],38:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":40,"./_stream_writable":42,"core-util-is":29,"inherits":32,"process-nextick-args":35}],39:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":41,"core-util-is":29,"inherits":32}],40:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":38,"./internal/streams/BufferList":43,"./internal/streams/destroy":44,"./internal/streams/stream":45,"_process":36,"core-util-is":29,"events":30,"inherits":32,"isarray":34,"process-nextick-args":35,"safe-buffer":50,"string_decoder/":52,"util":27}],41:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":38,"core-util-is":29,"inherits":32}],42:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":38,"./internal/streams/destroy":44,"./internal/streams/stream":45,"_process":36,"core-util-is":29,"inherits":32,"process-nextick-args":35,"safe-buffer":50,"util-deprecate":53}],43:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":50,"util":27}],44:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":35}],45:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":30}],46:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":47}],47:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":38,"./lib/_stream_passthrough.js":39,"./lib/_stream_readable.js":40,"./lib/_stream_transform.js":41,"./lib/_stream_writable.js":42}],48:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":47}],49:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":42}],50:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":28}],51:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":30,"inherits":32,"readable-stream/duplex.js":37,"readable-stream/passthrough.js":46,"readable-stream/readable.js":47,"readable-stream/transform.js":48,"readable-stream/writable.js":49}],52:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":50}],53:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
