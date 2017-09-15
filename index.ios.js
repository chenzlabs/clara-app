import React, { Component } from 'react';
import { AppRegistry, View, StatusBar } from 'react-native';
import WKWebView from 'react-native-wkwebview-reborn';
import { ARKit } from 'react-native-arkit';
import Voice from 'react-native-voice';
import Dimensions from 'Dimensions';
import Tts from 'react-native-tts';

// doesn't work?
import WebARonARKit from './WebARonARKit-json';

var RAD2DEG = 57.2958;

var finalResultsInterval = 1500;

function positionString(pos) { return pos.x + ' ' + pos.y + ' ' + pos.z; }

var dummyReturn = Promise.resolve(undefined);

export default class arkit1 extends Component {
  webviewEJS(js) {
    if (this.webview && this.webviewLoaded) {
      return this.webview.evaluateJavaScript(js); 
    }
    return dummyReturn;
  }

  emitCurrentFramePointCloudEvent(params) {
    var inner = 'points:[' + params.points + ']'
    //console.warn('currentFramePointCloud: ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("currentframepointcloud",{' + inner + '})}')
      .catch(function(e) { console.warn('emitCurrentFramePointCloudEvent eJS catch', e); });
  }

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
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("currentframeparams",{' + inner + '})}')
      .catch(function(e) { console.warn('emitCurrentFrameParamsEvent eJS catch', e); });
  }

  syncCurrentFrameParams(timestamp) {
    // Emit ARKit current frame params.
    var self = this;
    ARKit.getCurrentFrameParams().then(function (params) {
      self.emitCurrentFrameParamsEvent(params);
    });
  }

  emitAnalyzeCurrentFrameEvent(outputs) {
    var inner = 'timestamp:' + outputs.timestamp + ',results:[';
    for (var i=0; i<outputs.results.length; i++) {
      inner += (i>0 ? ',' : '')
      + '{confidence:' + outputs.results[i].confidence
      + ',identifier:"' + outputs.results[i].identifier + '"}';
    }
    inner += ']';
    //console.warn('analyzeCurrentFrame: ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]"); if (a) a.emit("analyzecurrentframe",{' + inner + '})}')
      .catch(function(e) { console.warn('emitAnalyzeCurrentFrameEvent eJS catch', e); });
  }

  analyzeCurrentFrame(modelName) {
    // Emit ARKit current frame params.
    var self = this;
    ARKit.analyzeCurrentFrame(modelName).then(function (outputs) {
      self.emitAnalyzeCurrentFrameEvent(outputs);
    });
  }

  emitBarcodesCurrentFrameEvent(outputs) {
    var inner = 'timestamp:' + outputs.timestamp + ',results:[';
    for (var i=0; i<outputs.results.length; i++) {
      inner += (i>0 ? ',' : '')
      + '{payload:"' + outputs.results[i].payload
      + '",symbology:"' + outputs.results[i].symbology + '"}';
    }
    inner += ']';
    //console.warn('barcodesCurrentFrame: ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("barcodescurrentframe",{' + inner + '})}')
      .catch(function(e) { console.warn('emitBarcodesCurrentFrameEvent eJS catch', e); });
  }

  barcodesCurrentFrame() {
    // Emit ARKit current frame params.
    var self = this;
    ARKit.barcodesCurrentFrame().then(function (outputs) {
      self.emitBarcodesCurrentFrameEvent(outputs);
    });
  }

  everyFrame(timestamp) {
    this.syncCurrentFrameParams(timestamp);

    this.rAF = requestAnimationFrame(this.everyFrameBound);
  }

  emitScenePlaneEvent(type, id, center, extent, alignment, camera, transform) {
    var inner = 
      'id:"' + id + '",';
    if (type !== "planeremoved") {
      inner += 
      'center:{x:' + center.x + ', y:' + center.y + ', z:' + center.z + '},'
      + 'extent:{x:' + extent.x + ', y:' + extent.y + ', z:' + extent.z + '},'
      + 'alignment:' + alignment + ','
      + 'camera:{x:' + camera.x + ', y:' + camera.y + ', z:' + camera.z + '},'
      + 'transform:[' + transform + ']'
      ;
    }
    //console.warn(type + ': ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("' + type + '",{' + inner + '})}')
      .catch(function(e) { console.warn('emitScenePlaneEvent eJS catch', e); });
  }
    
  onPlaneDetected(evt) {
    // extent, target, center, camera, alignment, id, transform
    this.emitScenePlaneEvent("planedetected", evt.id, evt.center, evt.extent, evt.alignment, evt.camera, evt.transform);
  }

  onPlaneUpdate(evt) {
    // extent, target, center, camera, alignment, id, transform
    this.emitScenePlaneEvent("planeupdate", evt.id, evt.center, evt.extent, evt.alignment, evt.camera, evt.transform);
  }

  onPlaneRemoved(evt) {
    // id
    this.emitScenePlaneEvent("planeremoved", evt.id);
  }

  onWebViewMessage(evt) {
    var self = this;
    var data = evt.body || (evt.nativeEvent && evt.nativeEvent.data);
    //console.warn('onWebViewMessage: ', data);

    // FIXME: implement WebARonARKit callbacks
    if (data.startsWith("setDepthNear:")) {
      console.warn(data);
    } else
    if (data.startsWith("setDepthFar:")) {
      console.warn(data);
    } else
    if (data.startsWith("log:")) {
      console.warn(data);
    } else
    if (data.startsWith("resetPose")) {
      console.warn(data);
      ARKit.restart();
    } else
    if (data.startsWith("showCameraFeed")) {
      console.warn(data);
      ARKit.restart();
    } else
    if (data.startsWith("hideCameraFeed")) {
      console.warn(data);
    } else

    if (data === 'disablePlaneDetection') {
      // FIXME! ARKit.setPlaneDetection(false);
    } else
    if (data === 'enablePlaneDetection') {
      // FIXME! ARKit.setPlaneDetection(true);
    } else
    if (data === 'voiceStart') {
      //console.warn(data);
      Voice.start('en'); // TODO: properly determine locale
    } else
    if (data === 'voiceStop') {
      //console.warn(data);
      Voice.stop();
    } else
    if (data === 'voiceCancel') {
      //console.warn(data);
      Voice.cancel();
    } else
    if (data === 'voiceAvailable') {
      //console.warn('voiceAvailable...');
      Voice.isAvailable((e) => {
        //console.warn('...voiceAvailable isAvailable', e);
        self.emitVoiceEvent('available', e);
      });
    } else
    if (data.startsWith('analyzeCurrentFrame')) {
      var modelName = (data.length > 20) ? data.substring(20) : '';
      this.analyzeCurrentFrame(modelName);
    } else
    if (data === 'barcodesCurrentFrame') {
      this.barcodesCurrentFrame();
    } else
    if (data === 'currentFrameParams') {
      this.syncCurrentFrameParams();
    } else
    if (data === 'currentFramePointCloud') {
      ARKit.getCurrentFramePointCloud().then(function(output) {
        self.emitCurrentFramePointCloudEvent(output);
      });
    } else
    if (data.startsWith('stopSpeaking')) {
      this.stopSpeaking();
    }
    if (data.startsWith('speak:')) {
      this.speak(data.substring(6));
    }
  }

  emitVoiceEvent(type, map) {
    var inner = JSON.stringify(map);
    //console.warn('voice' + type + ': ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("voice' + type + '",' + inner + ')}')
      .catch(function(e) { console.warn('emitVoiceEvent eJS catch', e); });
  }

  speak(txt) {
    //console.warn('speak:' + txt);
    // Disable voice while TTS is speaking, and re-enable when done.
    // FIXME: volume seems very low!
    this.wasVoiceRecognizing = Voice.isRecognizing();
    // let listener do this... Voice.stop();
    //Tts.setDucking(true);
    Tts.speak(txt);
  }

  stopSpeaking() {
    //console.warn('stopSpeaking:' + txt);
    Tts.stop();
  }

  emitTTSEvent(type, map) {
    var inner = JSON.stringify(map);
    //console.warn('tts-' + type + ': ' + inner);
    this.webviewEJS(
        'var s=document.querySelector("a-scene");'
        + 'if(s&&s.hasLoaded){var a=document.querySelector("[rn-arkit]");if (a) a.emit("tts-' + type + '",' + inner + ')}')
      .catch(function(e) { console.warn('emitTTSEvent eJS catch', e); });
  }

  constructor(props) {
    super(props);
    this.everyFrameBound = this.everyFrame.bind(this);

    // read in the WebAR Javascript
    this.injectedJS = WebARonARKit.js;

    this.language = 'en-US';
    Tts.setDefaultLanguage(this.language);
    Tts.voices().then(voices => { 
      for (var i=0; i<voices.length; i++) {
        if (voices[i].language === this.language) {
          //console.warn('voice ' + voices[i].id + ' (' + voices[i].language + ')');
          Tts.setDefaultVoice(voices[i].id);
          break;
        }
      }
    });

    // Pass up TTS events.
    Tts.addEventListener('tts-start', (evt) => { this.emitTTSEvent('start', evt); });
    Tts.addEventListener('tts-pause', (evt) => { this.emitTTSEvent('pause', evt); });
    Tts.addEventListener('tts-resume', (evt) => { this.emitTTSEvent('resume', evt); });
    Tts.addEventListener('tts-cancel', (evt) => { this.emitTTSEvent('cancel', evt); });
    Tts.addEventListener('tts-finish', (evt) => { this.emitTTSEvent('finish', evt); });
    Tts.addEventListener('tts-progress', (evt) => { this.emitTTSEvent('progress', evt); });
  }

  componentDidMount() {
    // Don't do anymore unless/until asked by client page.
    //this.rAF = requestAnimationFrame(this.everyFrameBound);

    var self = this;
    Voice.onSpeechStart = (e) => {
      //console.warn('SpeechStart');
      self.emitVoiceEvent('start', e);
    };
    Voice.onSpeechEnd = (e) => {
      //console.warn('SpeechEnd');
      self.emitVoiceEvent('end', e);
      //Voice.start(locale);
    };
    Voice.onSpeechError = (e) => {
      //console.warn('SpeechError', e.error);
      self.emitVoiceEvent('error', e.error);
    };
    Voice.onSpeechRecognized = (e) => {
      //console.warn('Recognized', e);
      self.emitVoiceEvent('recognized', e.value);
      // Stop and start next utterance after an interval.
      if (self.voiceTimeout) {
        //console.warn(Date.now() + ':"' + e.value + '" was pending, clear timeout');
        clearTimeout(self.voiceTimeout); 
      } 
      console.warn(Date.now() + ':"' + e.value + '" start timeout ' + finalResultsInterval);
      self.voiceTimeout = setTimeout(function () {
        self.voiceTimeout = null;
        //if (Voice.isRecognizing()) {
          //console.warn(Date.now() + ':"' + e.value + '" end timeout ' + finalResultsInterval);
          Voice.cancel();
          self.emitVoiceEvent('finalrecognized', e.value);
        //}
      }, finalResultsInterval);
    };
    Voice.onSpeechPartialResults = (e) => {
      //console.warn('PartialResults', e.value);
      self.emitVoiceEvent('partial', e.value);
    };
    Voice.onSpeechResults = (e) => {
      //console.warn('Results', e.value);
      self.emitVoiceEvent('results', e.value);
    };
    Voice.isAvailable((e) => {
      //console.warn('isAvailable', e);
      self.emitVoiceEvent('available', e);
    });
  }

  onWebARSetData(evt) {
    this.webviewEJS(evt.js); 
  }

  onWebARAnchorEvent(evt) {
    this.webviewEJS(evt.js); 
  }

  onWebARUpdateWindowSize(evt) {
    this.webviewEJS(evt.js); 
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }

  render() {
    // why won't WebView draw under StatusBar?  fine, hide it
    var debug = false;

    return (
      <View style={{ flex:1 }}>
        <ARKit
          style={{ flex: 1 }}
          debug={ debug }
          planeDetection
          lightEstimation
          onPlaneDetected={(e) => this.onPlaneDetected(e)}
          onPlaneUpdate={(e) => this.onPlaneUpdate(e)}
          onPlaneRemoved={(e) => this.onPlaneRemoved(e)}
          onWebARSetData={ (e) => this.onWebARSetData(e) }
          onWebARAnchorEvent={ (e) => this.onWebARAnchorEvent(e) }
          onWebARUpdateWindowSize={ (e) => this.onWebARUpdateWindowSize(e) }
        >
          <StatusBar hidden/>
          <WKWebView
            ref={(el) => this.webview = el}
            style={{ backgroundColor: 'transparent', flex: 1 }}
            source={{ uri: 'https://clara.glitch.me' }}
            sendCookies={ true }
            allowsInlineMediaPlayback={ true }
            mediaPlaybackRequiresUserAction={ false }
            scrollEnabled={ false }
            pagingEnabled={ false }
            bounces={ false }
            allowsBackForwardNavigationGestures={ false }
            onMessage={(e) => this.onWebViewMessage(e) }
            onLoadStart={(e) => this.webviewLoaded = false }
            onLoad={(e) => this.webviewLoaded = true }
            injectedJavaScript={ this.injectedJS }
          />

          {debug && <ARKit.Box
            pos={{ x: 0, y: 0, z: 0 }}
            shape={{ width: 0.1, height: 0.1, length: 0.1, chamfer: 0.01 }}
          />}
          {debug && <ARKit.Sphere
            pos={{ x: 0.2, y: 0, z: 0 }}
            shape={{ radius: 0.05 }}
          />}
          {debug && <ARKit.Cylinder
            pos={{ x: 0.4, y: 0, z: 0 }}
            shape={{ radius: 0.05, height: 0.1 }}
          />}
          {debug && <ARKit.Cone
            pos={{ x: 0, y: 0.2, z: 0 }}
            shape={{ topR: 0, bottomR: 0.05, height: 0.1 }}
          />}
          {debug && <ARKit.Pyramid
            pos={{ x: 0.2, y: 0.15, z: 0 }}
            shape={{ width: 0.1, height: 0.1, length: 0.1 }}
          />}
          {debug && <ARKit.Tube
            pos={{ x: 0.4, y: 0.2, z: 0 }}
            shape={{ innerR: 0.03, outerR: 0.05, height: 0.1 }}
          />}
          {debug && <ARKit.Torus
            pos={{ x: 0, y: 0.4, z: 0 }}
            shape={{ ringR: 0.06, pipeR: 0.02 }}
          />}
          {debug && <ARKit.Capsule
            pos={{ x: 0.2, y: 0.4, z: 0 }}
            shape={{ capR: 0.02, height: 0.06 }}
          />}
          {debug && <ARKit.Plane
            pos={{ x: 0.4, y: 0.4, z: 0 }}
            shape={{ width: 0.1, height: 0.1 }}
          />}
          {debug && <ARKit.Text
            text="ARKit is Cool!"
            pos={{ x: 0.2, y: 0.6, z: 0 }}
            font={{ size: 0.15, depth: 0.05 }}
          />}
        </ARKit>
      </View>
    );
  }
}

AppRegistry.registerComponent('arkit1', () => arkit1);

