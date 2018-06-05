import './config';
import 'webvr-polyfill';

import {
  Color,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';

import VRControls from 'three-vrcontrols-module';
import VREffect from 'three-vreffect-module';

import * as WebvrUI from 'webvr-ui/build/webvr-ui';

export default class App {
  constructor() {
    const UI = document.createElement('div');
    UI.setAttribute('id', 'ui');
    UI.style.position = 'fixed';
    UI.style.bottom = '10px';
    UI.style.left = '50%';
    UI.style.transform = 'translate(-50%, -50%)';
    UI.style.textAlign = 'center';
    UI.style.fontFamily = 'sans-serif';
    UI.style.zIndex = '10';

    const VR_BTN = document.createElement('div');
    VR_BTN.setAttribute('id', 'vr-button');

    const MAGIC_WIN = document.createElement('a');
    MAGIC_WIN.setAttribute('id', 'magic-window');
    MAGIC_WIN.setAttribute('href', '#');
    MAGIC_WIN.style.display = 'block';
    MAGIC_WIN.style.color = 'white';
    MAGIC_WIN.style.marginTop = '1em';

    const MAGIC_TXT = document.createTextNode('Try it without a headset');

    MAGIC_WIN.appendChild(MAGIC_TXT);
    UI.appendChild(VR_BTN);
    UI.appendChild(MAGIC_WIN);
    document.body.appendChild(UI);

    this.animations = [];
    this.backgroundColor = 0x000000;
    this.vrDisplay;

    this.uiOptions = {
      color: '#e0e0e0',
      corners: 'round',
    };

    const renderer = this.renderer = new WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const effect = this.effect = new VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    const scene = this.scene = new Scene();
    scene.background = new Color(this.backgroundColor);

    const camera = this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);

    const controls = this.controls = new VRControls(camera);
    controls.standing = true;
    camera.position.y = controls.userHeight;

    const vrButton = this.vrButton = new WebvrUI.EnterVRButton(renderer.domElement, this.uiOptions);
    vrButton.on('exit', () => {
      camera.quaternion.set(0, 0, 0, 1);
      camera.position.set(0, controls.userHeight, 0);
    });
    vrButton.on('hide', function() {
      document.getElementById('ui').style.display = 'none';
    });
    vrButton.on('show', function() {
      document.getElementById('ui').style.display = 'inherit';
    });
    VR_BTN.appendChild(vrButton.domElement);
    MAGIC_WIN.addEventListener('click', function() {
      vrButton.requestEnterFullscreen().catch((e) => {
        if (e.message === 'e.manager.enterFullscreen(...).then is not a function') {
          console.log('webvr-ui fullscreen hotfix');
        } else {
          return e;
        }
      });
    });

    vrButton.getVRDisplay().then((display) => {
      if (display) {
        renderer.vr.setDevice(display);
      }
    }).catch((e) => {
      if (e.message === 'No displays found') {
        console.log('No VR Display Found');
      } else {
        return e;
      }
    });

    navigator.getVRDisplays().then((displays) => {
      if (displays.length > 0) {
        this.vrDisplay = displays[0];
        this.vrDisplay.requestAnimationFrame(this.render);
      }
    });

    this._bind('render', 'resize');

    window.addEventListener('resize', this.resize, true);
    window.addEventListener('vrdisplaypresentchange', this.resize, true);
  }

  _bind(...methods) {
    methods.forEach((method) => this[method] = this[method].bind(this));
  }

  render() {
    if (this.vrButton.isPresenting()) {
      this.controls.update();
    }

    this.effect.render(this.scene, this.camera);

    this.animations.forEach((animation, i, a) => {
      animation();
    });

    this.vrDisplay.requestAnimationFrame(this.render);
  }

  resize(e) {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.effect.setSize(window.innerWidth, window.innerHeight);
  }

  add(asset) {
    this.scene.add(asset);
  }

  addAnimation(animation) {
    this.animations.push(animation);
  }
};
