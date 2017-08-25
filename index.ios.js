import React, { Component } from 'react';
import { AppRegistry, View, StatusBar } from 'react-native';
import WKWebView from 'react-native-wkwebview-reborn';
import { ARKit } from 'react-native-arkit';
import Dimensions from 'Dimensions';

var RAD2DEG = 57.2958;

function positionString(pos) { return pos.x + ' ' + pos.y + ' ' + pos.z; }

export default class arkit1 extends Component {
  emitCurrentFrameParamsEvent(params) {
    var inner = 'projectionMatrix:[' + params.projectionMatrix + ']'
    + ',transform:[' + params.transform + ']'
    + ',imageResolution:{width:' + params.imageResolution.width
      + ',height:' + params.imageResolution.height + '}'
    + ',intrinsics:[' + params.intrinsics + ']'
    + ',lightEstimate:{ambientIntensity:' + params.lightEstimate.ambientIntensity
    // + ',ambientColorTemperature:' + params.lightEstimate.ambientColorTemperature
    + '}';
    //console.warn('currentFrameParams: ' + inner);
    if (this.webview && this.webviewLoaded) {
      this.webview.evaluateJavaScript(
        'var s=document.querySelector("a-scene");'
        + 'if(s.hasLoaded){s.emit("currentframeparams",{' + inner + '})}');
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
    this.syncCurrentFrameParams(timestamp);

    this.rAF = requestAnimationFrame(this.everyFrameBound);
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
    if (this.webview && this.webviewLoaded) {
      this.webview.evaluateJavaScript(
        'var s=document.querySelector("a-scene");'
        + 'if(s.hasLoaded){s.emit("' + type + '",{' + inner + '})}');
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

  onWebViewMessage(evt) {
    var data = evt.nativeEvent.data;
    console.warn('onWebViewMessage: ', data);
    if (data === 'disablePlaneDetection') {
      ARKit.planeDetection = false;
    } else
    if (data === 'enablePlaneDetection') {
      ARKit.planeDetection = true;
    }
  }

  constructor(props) {
    super(props);
    this.everyFrameBound = this.everyFrame.bind(this);
    this.onPlaneDetectedBound = this.onPlaneDetected.bind(this);
    this.onPlaneUpdateBound = this.onPlaneUpdate.bind(this);
    this.onPlaneRemovedBound = this.onPlaneRemoved.bind(this);
    this.onWebViewMessageBound = this.onWebViewMessage.bind(this);
  }

  componentDidMount() {
    this.rAF = requestAnimationFrame(this.everyFrameBound);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }

  render() {
    // why won't WebView draw under StatusBar?  fine, hide it
    return (
      <View style={{ flex:1 }}>
        <ARKit
          style={{ flex: 1 }}
          planeDetection
          lightEstimation
          onPlaneDetected={(e) => this.onPlaneDetected(e)}
          onPlaneUpdate={(e) => this.onPlaneUpdate(e)}
          onPlaneRemoved={(e) => this.onPlaneRemoved(e)}
        >
          <StatusBar hidden/>
          <WKWebView
            ref={(el) => this.webview = el}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            source={{ uri: 'https://vivacious-butter.glitch.me' }}
            sendCookies={ true }
            allowsInlineMediaPlayback={ true }
            mediaPlaybackRequiresUserAction={ false }
            scrollEnabled={ false }
            onMessage={(e) => this.onWebViewMessage(e) }
            onLoadStart={(e) => this.webviewLoaded = false }
            onLoad={(e) => this.webviewLoaded = true }
          />
        </ARKit>
      </View>
    );
/*
    return (
      <View style={{ flex: 1 }}>
        <ARKit
          style={{ flex: 1 }}
          debug
          planeDetection
          lightEstimation
          onPlaneDetected={this.onPlaneDetectedBound}
          onPlaneUpdate={this.onPlaneUpdateBound}
          onPlaneRemoved={this.onPlaneRemovedBound}
        >
          <StatusBar hidden/>
          <WebView
            ref={(el) => this.webView = el}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            source={{ uri: 'https://vivacious-butter.glitch.me' }}
            allowsInlineMediaPlayback={ true }
            mediaPlaybackRequiresUserAction={ false }
            scrollEnabled={ false }
            onMessage={ this.onWebViewMessageBound }
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
*/
  }
}

AppRegistry.registerComponent('arkit1', () => arkit1);

