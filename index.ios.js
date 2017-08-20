/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppRegistry, View, WebView, StatusBar } from 'react-native';
import { ARKit } from 'react-native-arkit';
import Dimensions from 'Dimensions';

var RAD2DEG = 57.2958;

function positionString(pos) { return pos.x + ' ' + pos.y + ' ' + pos.z; }

export default class arkit1 extends Component {
  showDimensions(timestamp) {
    if (this.webView) {
      this.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value", "' + timestamp + ': ' + Dimensions.get('window').width + 'x' + Dimensions.get('window').height + '");');
    }
  }

  syncCameraPosition(timestamp) {
    // Use camera position provided by ARKit.

    // FIXME: works for portrait, and 90 CCW, but not 90 CW or 180
    var w = Dimensions.get('window');
    var EULERZOFFSET = (w.height > w.width) ? 90 : 0;

    var self = this;
    ARKit.getCameraPosition().then(function (camPos) {
      var inner = 
        '"position":{x:' + camPos.x
        + ',y:' + camPos.y
        + ',z:' + camPos.z
        + '},"rotation":{x:' + (RAD2DEG * camPos.eulerX)
        + ',y:' + (RAD2DEG * camPos.eulerY)
        + ',z:' + (EULERZOFFSET + RAD2DEG * camPos.eulerZ)
        ;
      //console.warn('syncCameraPose: ' + inner);
      if (self.webView) {
        self.webView.injectJavaScript(
          'document.querySelector("a-scene").emit("synccamerapose",{'
          + inner + '}})'); 
      }
    });
  }

  emitCurrentFrameParamsEvent(params) {
    var projMatrix = params.projectionMatrix;
    var inner = 'projectionMatrix:[' + projMatrix + ']'; //JSON.stringify(projMatrix);
    //console.warn('currentFrameParams: ' + inner);
    if (this.webView) {
      this.webView.injectJavaScript(
        'document.querySelector("a-scene").emit("currentframeparams",{'
        + inner + '})');
    }
  }

  syncCurrentFrameParams(timestamp) {
    // Emit ARKit current frame params.
    var self = this;
    ARKit.getCurrentFrameParams().then(function (params) {
      self.emitCurrentFrameParamsEvent(params);
    });
  }

  everyFrame(timestamp) {
    //this.showDimensions(timestamp);
    this.syncCameraPosition(timestamp);
    this.syncCurrentFrameParams(timestamp);

    this.rAF = requestAnimationFrame(this.everyFrame);
  }

  emitScenePlaneEvent(type, id, node, quaternion, center, extent, alignment, camera, transform) {
    var inner = 
      'id:"' + id + '",';
    if (type !== "planeremoved") {
      inner += 'node:{x:' + node.x + ', y:' + node.y + ', z:' + node.z + '},'
      + 'quaternion:{x:' + quaternion.x + ', y:' + quaternion.y + ', z:' + quaternion.z + ',w:' + quaternion.w + '},'
      + 'center:{x:' + center.x + ', y:' + center.y + ', z:' + center.z + '},'
      + 'extent:{x:' + extent.x + ', y:' + extent.y + ', z:' + extent.z + '},'
      + 'alignment:' + alignment + ','
      + 'camera:{x:' + camera.x + ', y:' + camera.y + ', z:' + camera.z + '},'
      + 'transform:[' + transform + ']'
      ;
    }
    //console.warn(type + ': ' + inner);
    if (this.webView) {
      this.webView.injectJavaScript(
        'document.querySelector("a-scene").emit("'
        + type + '",{' + inner + '})');
    }
  }
    
  onPlaneDetected(evt) {
    // extent, target, center, camera, alignment, node, id, quaternion, transform
    this.emitScenePlaneEvent("planedetected", evt.id, evt.node, evt.quaternion, evt.center, evt.extent, evt.alignment, evt.camera, evt.transform);
  }

  onPlaneUpdate(evt) {
    // extent, target, center, camera, alignment, node, id, quaternion, transform
    this.emitScenePlaneEvent("planeupdate", evt.id, evt.node, evt.quaternion, evt.center, evt.extent, evt.alignment, evt.camera, evt.transform);
  }

  onPlaneRemoved(evt) {
    // id
    this.emitScenePlaneEvent("planeremoved", evt.id);
  }

  componentDidMount() {
    this.everyFrame = this.everyFrame.bind(this);
    this.rAF = requestAnimationFrame(this.everyFrame);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }
  render() {
/*
    return (
      <View style={{ flex:1 }}>
        <ARKit
          ref={(el) => this.ARKit = el}
          style={{ flex: 1 }}
          no-debug
          planeDetection
          lightEstimation
          onPlaneDetected={this.onPlaneDetected.bind(this)}
          onPlaneUpdate={this.onPlaneUpdate.bind(this)}
          onPlaneRemoved={this.onPlaneRemoved.bind(this)}
        >
          <WebView
            ref={(el) => this.webView = el}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            source={{ uri: 'https://vivacious-butter.glitch.me' }}
            allowsInlineMediaPlayback={ true }
            mediaPlaybackRequiresUserAction={ false }
            scrollEnabled={ false }
          />
        </ARKit>
      </View>
    );
*/
    // why won't WebView draw under StatusBar?  fine, hide it
    // well, that doesn't work either... WebView still won't draw under it
    // forcibly showing it doesn't work, ARKit draws over whole background
    return (
      <View style={{ flex: 1 }}>
        <ARKit
          ref={(el) => this.ARKit = el}
          style={{ flex: 1 }}
          debug
          planeDetection
          lightEstimation
          onPlaneDetected={this.onPlaneDetected.bind(this)}
          onPlaneUpdate={this.onPlaneUpdate.bind(this)}
          onPlaneRemoved={this.onPlaneRemoved.bind(this)}
        >
          <StatusBar hidden/>
          <WebView
            ref={(el) => this.webView = el}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            source={{ uri: 'https://vivacious-butter.glitch.me' }}
            allowsInlineMediaPlayback={ true }
            mediaPlaybackRequiresUserAction={ false }
            scrollEnabled={ false }
          />

          <ARKit.Box
            pos={{ x: 0, y: 0, z: 0 }}
            shape={{ width: 0.1, height: 0.1, length: 0.1, chamfer: 0.01 }}
          />
          <ARKit.Sphere
            pos={{ x: 0.2, y: 0, z: 0 }}
            shape={{ radius: 0.05 }}
          />
          <ARKit.Cylinder
            pos={{ x: 0.4, y: 0, z: 0 }}
            shape={{ radius: 0.05, height: 0.1 }}
          />
          <ARKit.Cone
            pos={{ x: 0, y: 0.2, z: 0 }}
            shape={{ topR: 0, bottomR: 0.05, height: 0.1 }}
          />
          <ARKit.Pyramid
            pos={{ x: 0.2, y: 0.15, z: 0 }}
            shape={{ width: 0.1, height: 0.1, length: 0.1 }}
          />
          <ARKit.Tube
            pos={{ x: 0.4, y: 0.2, z: 0 }}
            shape={{ innerR: 0.03, outerR: 0.05, height: 0.1 }}
          />
          <ARKit.Torus
            pos={{ x: 0, y: 0.4, z: 0 }}
            shape={{ ringR: 0.06, pipeR: 0.02 }}
          />
          <ARKit.Capsule
            pos={{ x: 0.2, y: 0.4, z: 0 }}
            shape={{ capR: 0.02, height: 0.06 }}
          />
          <ARKit.Plane
            pos={{ x: 0.4, y: 0.4, z: 0 }}
            shape={{ width: 0.1, height: 0.1 }}
          />
          <ARKit.Text
            text="ARKit is Cool!"
            pos={{ x: 0.2, y: 0.6, z: 0 }}
            font={{ size: 0.15, depth: 0.05 }}
          />
        </ARKit>
      </View>
    );
  }
}

AppRegistry.registerComponent('arkit1', () => arkit1);

