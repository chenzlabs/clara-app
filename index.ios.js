/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import { AppRegistry, View, WebView } from 'react-native';
import { ARKit } from 'react-native-arkit';
import Dimensions from 'Dimensions';

export default class arkit1 extends Component {
  everyFrame(timestamp) {
    var self = this;

    // Use camera position provided by ARKit.
    ARKit.getCameraPosition().then(function (camPos) {
      if (self.webView) {
        self.webView.injectJavaScript('document.querySelector("[camera]").setAttribute("position","' + camPos.x + ' ' + camPos.y + ' ' + camPos.z + '");');

        self.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value", "' + timestamp + ': ' + Dimensions.get('window').width + 'x' + Dimensions.get('window').height + '\\n ' + camPos.x + ',\\n' + camPos.y + ',\\n' + camPos.z + '");');
      }
    });
    // Use projection matrix provided by ARKit.
    ARKit.getCameraProjectionMatrix().then(function (projMatrix) {
      if (self.webView) {
        // gather into array; stupid, but working...
        var projMatrixString = '[';
        for (var c=0; c<4; c++) {
          for (var r=0; r<4; r++) {
           if (c || r) { projMatrixString += ','; }
           projMatrixString += projMatrix['c' + c + 'r' + r];
          }
        }
        projMatrixString += ']';

        // NOTE: this does work, 
        // but the projection matrix from iOS seems off somehow,
        // makes things taller (when dimensions are 414x736);
        // what A-Frame uses by default seems better?!?
        //self.webView.injectJavaScript('document.querySelector("a-scene").camera.projectionMatrix.elements = ' + projMatrixString);

        //self.webView.injectJavaScript('document.querySelector("[text]").setAttribute("value", "' + timestamp + ': ' + projMatrixString + '");');
      }
    });

    self.rAF = requestAnimationFrame(self.everyFrame);
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
          onPlaneDetected={console.log} // event listener for plane detection
          onPlaneUpdate={console.log} // event listener for plane update
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

