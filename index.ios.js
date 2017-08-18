/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppRegistry, View, WebView } from 'react-native';
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
    var self = this;
    ARKit.getCameraPosition().then(function (camPos) {
      if (self.webView) {
        // send event instead of directly manipulating camera

        // FIXME: works for portrait, and 90 CCW, but not 90 CW or 180
        var w = Dimensions.get('window');
        var EULERZOFFSET = (w.height > w.width) ? 90 : 0;
/*
        var injectMe = 
          'var c=document.querySelector("[camera]");'
        + 'c.setAttribute("position","' + positionString(camPos) + '");';

        if (camPos.eulerX) {
          injectMe += 'c.setAttribute("rotation","'
            + (RAD2DEG * camPos.eulerX) + ' '
            + (RAD2DEG * camPos.eulerY) + ' '
            + (EULERZOFFSET + RAD2DEG * camPos.eulerZ) + '");'; 
        }
        self.webView.injectJavaScript(injectMe);
*/
        self.webView.injectJavaScript(
          'document.querySelector("a-scene").emit("synccamerapose",{'
        + '"position":{x:' + camPos.x
          + ',y:' + camPos.y
          + ',z:' + camPos.z
        + '},"rotation":{x:' + (RAD2DEG * camPos.eulerX)
          + ',y:' + (RAD2DEG * camPos.eulerY)
          + ',z:' + (EULERZOFFSET + RAD2DEG * camPos.eulerZ)
        + '}})'); 
      }
    });
  }

  syncCameraProjectionMatrix(timestamp) {
    // Use projection matrix provided by ARKit.
    var self = this;
    ARKit.getCameraProjectionMatrix().then(function (projMatrix) {
      if (self.webView) {
        // TODO: send event instead of directly manipulating camera

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
    //this.showDimensions(timestamp);
    this.syncCameraPosition(timestamp);
    //this.syncCameraProjectionMatrix(timestamp);

    this.rAF = requestAnimationFrame(this.everyFrame);
  }

  emitScenePlaneEvent(type, id, node, quaternion, center, extent) {
    if (this.webView) {
      this.webView.injectJavaScript(
        'document.querySelector("a-scene").emit("' + type + '",{'
      + 'id:"' + id + '",'
      + 'node:{x:' + node.x + ', y:' + node.y + ', z:' + node.z + '},'
      + 'quaternion:{x:' + quaternion.x + ', y:' + quaternion.y + ', z:' + quaternion.z + ',w:' + quaternion.w + '},'
      + 'center:{x:' + center.x + ', y:' + center.y + ', z:' + center.z + '},'
      + 'extent:{x:' + extent.x + ', y:' + extent.y + ', z:' + extent.z + '}'
      + '})');
    }
  }
    
  createOrUpdatePlane(id, node, center, extent) {
    if (this.webView) {
      this.webView.injectJavaScript(
        'var d=document;var scene=d.querySelector("a-scene");'
      + 'var e=d.querySelector("#plane-' + id + '") || d.createElement("a-box");'
      + 'e.setAttribute("position","' + (node.x + center.x) + ' ' + (node.y + center.y) + ' ' + (node.z + center.z) + '");'
      + 'e.setAttribute("width", "' + extent.x + '");'
      + 'e.setAttribute("depth", "' + extent.z + '");'
      + 'if (!e.parentElement) {'
        + 'e.setAttribute("id", "plane-' + id + '");'
        + 'e.setAttribute("material", {color:"red",opacity:0.5});'
        + 'e.setAttribute("height", "0.001");'
        + 'scene.appendChild(e);}'
      );
    }
  }

  onPlaneDetected(evt) {
    // extent, target, center, camera, alignment, node, id, quaternion
/*
    var msg = 'onPlaneDetected id ' + evt.id + ' node ' + positionString(evt.node) + ' center ' + positionString(evt.center) + ' extent ' + positionString(evt.extent) + ' alignment ' + evt.alignment;
    console.warn(msg);
*/
    //this.createOrUpdatePlane(evt.id, evt.node, evt.center, evt.extent);
    this.emitScenePlaneEvent("planedetected", evt.id, evt.node, evt.quaternion, evt.center, evt.extent);
  }

  onPlaneUpdate(evt) {
    // extent, target, center, camera, alignment, node, id
/*
    var msg = 'onPlaneUpdate id ' + evt.id + ' node ' + positionString(evt.node) + ' center ' + positionString(evt.center) + ' extent ' + positionString(evt.extent) + ' alignment ' + evt.alignment;
    console.warn(msg);
*/
    //this.createOrUpdatePlane(evt.id, evt.node, evt.center, evt.extent);
    this.emitScenePlaneEvent("planeupdate", evt.id, evt.node, evt.quaternion, evt.center, evt.extent);
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
    return (
      <View style={{ flex:1 }}>
        <ARKit
          ref={(el) => this.ARKit = el}
          style={{ flex: 1 }}
          debug
          planeDetection
          lightEstimation
          onPlaneDetected={this.onPlaneDetected.bind(this)}
          onPlaneUpdate={this.onPlaneUpdate.bind(this)}
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

