import './main.css';
import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

// シーンの作成
const scene = new THREE.Scene();

// カメラの作成
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1,100000);
camera.position.set(10, 10, 10);
scene.add(camera);

// キャンバスの設定
const canvas  = document.getElementById('three-canvas') as HTMLCanvasElement;
const context = canvas.getContext('webgl2') as WebGL2RenderingContext;

// コントロール
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.enablePan = false;
orbitControls.enableZoom = false;

const zoomControls = new TrackballControls(camera, canvas);
zoomControls.noPan     = true;
zoomControls.noRotate  = true;
zoomControls.zoomSpeed = 0.2;

// ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({
  canvas,
  context,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setAnimationLoop(animate);

// アニメーション
function animate() {
  const target = orbitControls.target;
  orbitControls.update();
  zoomControls.target.set(target.x, target.y, target.z);
  zoomControls.update();

  renderer.render(scene, camera);
};
animate();

// 画面リサイズ時にキャンバスもリサイズ
function onResize() {
  // サイズを取得
  const width = window.innerWidth;
  const height = window.innerHeight;
  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};
onResize()
window.addEventListener('resize', onResize);

const addModel = (url: string) => {
  new GLTFLoader().load(url, function (gltf) {
    const model = gltf.scene;
    model.traverse((object: any) => {
      if (object.isMesh) {
        object.material.needUpdate = true;
        // object.material = characterMaterial;
      }
    });
    model.scale.set(1, 1, 1);
    scene.add(model);
    })
};

// オブジェクトを読み込み
const loadObjs = async () => {
    // モデルを読み込み
    addModel('models/MatumotoCivicArtsCenter_04.glb');
    addModel('models/Xbot.glb');
};

// 読み込み開始
loadObjs();