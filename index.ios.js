/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppRegistry, View, WebView } from 'react-native';
import { ARKit } from 'react-native-arkit';
import Dimensions from 'Dimensions';

function positionString(pos) { return pos.x + ' ' + pos.y + ' ' + pos.z; }

export default class arkit1 extends Component {
  showDimensions(timestamp) {
    if (this.webView) {
      this.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value", "' + timestamp + ': ' + Dimensions.get('window').width + 'x' + Dimensions.get('window').height + '");');
    }
  }

  syncCameraPosition(timestamp) {
    // Use camera position provided by ARKit.
    var self = this;
    ARKit.getCameraPosition().then(function (camPos) {
      if (self.webView) {
        var RAD2DEG = 57.2958;

        // FIXME: works for upright portrait, and 90 degrees CCW,
        //        but not 90 CW or 180
        var EULERZOFFSET = (Dimensions.get('window').height > Dimensions.get('window').width) ? 90 : 0;

        var injectMe = 
        'var c=document.querySelector("[camera]");c.setAttribute("position","' + camPos.x + ' ' + camPos.y + ' ' + camPos.z + '");';
        if (camPos.eulerX) {
          injectMe += 'c.setAttribute("rotation","'
            + (RAD2DEG * camPos.eulerX) + ' '
            + (RAD2DEG * camPos.eulerY) + ' '
            + (EULERZOFFSET + RAD2DEG * camPos.eulerZ) + '");'; 
        }
        self.webView.injectJavaScript(injectMe);

        // show on screen
/*
        self.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value","' + timestamp + ': ' + camPos.x + ' ' + camPos.y + ' ' + camPos.z
            + (RAD2DEG * camPos.eulerX) + ' '
            + (RAD2DEG * camPos.eulerY) + ' '
            + (EULERZOFFSET + RAD2DEG * camPos.eulerZ) + '");'); 
*/
      }
    });
  }

  syncCameraProjectionMatrix(timestamp) {
    // Use projection matrix provided by ARKit.
    var self = this;
    ARKit.getCameraProjectionMatrix().then(function (projMatrix) {
      if (self.webView) {
        // gather into array; stupid, but working...
        var projMatrixString = '[';
        for (var c=0; c<16; c++) {
          if (c) { projMatrixString += ','; }
          projMatrixString += projMatrix['c' + Math.floor(c/4) + 'r' + (c%4)];
        }
        projMatrixString += ']';

        // NOTE: this does work, 
        // but the projection matrix from iOS seems off somehow,
        // makes things taller (when dimensions are 414x736);
        // what A-Frame uses by default seems better?!?
        self.webView.injectJavaScript('document.querySelector("a-scene").camera.projectionMatrix.elements = ' + projMatrixString);

        // show on screen
        //self.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value", "' + timestamp + ': ' + projMatrixString + '");');
      }
    });
  }


  everyFrame(timestamp) {
    this.showDimensions(timestamp);
    this.syncCameraPosition(timestamp);
    //this.syncCameraProjectionMatrix(timestamp);

    this.rAF = requestAnimationFrame(this.everyFrame);
  }

  onPlaneDetected(evt) {
    // extent, target, center, camera, alignment, node, id
    var msg = 'onPlaneDetected center ' + positionString(evt.center) + ' extent ' + positionString(evt.extent) + ' id ' + evt.id + ' alignment ' + evt.alignment;
    console.warn(msg);
    
    if (self.webView) {
      self.webView.injectJavaScript('var scene = document.querySelector("a-scene"); var e = document.createElement("a-box"); e.setAttribute("id", evt.id); e.setAttribute("position","' + positionString(evt.center) + '"); e.setAttribute("width", "' + evt.extent.x + '"); e.setAttribute("height", "' + evt.extent.z + '"); scene.appendChild(e)');
    }
  }

  onPlaneUpdate(evt) {
    // extent, target, center, camera, alignment, node, id
    var msg = 'onPlaneUpdate center ' + positionString(evt.center) + ' extent ' + positionString(evt.extent) + ' id ' + evt.id + ' alignment ' + evt.alignment;
    console.warn(msg);
  }

  componentDidMount() {
    this.everyFrame = this.everyFrame.bind(this);
    this.rAF = requestAnimationFrame(this.everyFrame);
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }
  render() {
    return (
      <View style={{ flex:1 }}>
        <ARKit
          ref={(el) => this.ARKit = el}
          style={{ flex: 1 }}
          debug
          planeDetection
          lightEstimation
          onPlaneDetected={this.onPlaneDetected} // event listener for plane detection
          onPlaneUpdate={this.onPlaneUpdate} // event listener for plane update
        >
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

