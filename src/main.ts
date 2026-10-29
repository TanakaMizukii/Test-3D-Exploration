import './main.css';
import * as THREE from "three";
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import { JoystickControl } from './ui/joystickControl';


// シーンの作成
const scene = new THREE.Scene();

// カメラの作成
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1,100000);
camera.position.set(20, 20, 100);
scene.add(camera);

// キャンバスの設定
const canvas  = document.getElementById('three-canvas') as HTMLCanvasElement;
const context = canvas.getContext('webgl2') as WebGL2RenderingContext;

// コントロール
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.enablePan     = true;
orbitControls.enableZoom    = false;

const zoomControls = new TrackballControls(camera, canvas);
zoomControls.noPan     = true;
zoomControls.noRotate  = true;
zoomControls.zoomSpeed = 0.2;

// ライト
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({
  canvas,
  context,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setAnimationLoop(animate);


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

const objs: {
  [key: string]: THREE.Object3D;
} = {};

const addStructureModel = (url: string, name: string) => {
  new GLTFLoader().load(url, function (gltf) {
    const model = gltf.scene;
    objs[name] = model;

    scene.add(model);

    // 階層の要素への書き出し
    const hierarcyPanel = document.getElementById('object-hierarchy');
    if (!hierarcyPanel) return;
    // hierarcyPanel.replaceChild();
    createHierarhyUI(model, hierarcyPanel);

    function createHierarhyUI(object: THREE.Object3D, container: HTMLElement) {
      // 子要素を持つものは <details> で折りたたみ可能にする
      const hasChildren = object.children.length > 0;
      const item = document.createElement(hasChildren ? 'details' : 'div');
      // 行のヘッダー部分（details の場合は summary がクリックで開閉する）
      const header = document.createElement(hasChildren ? 'summary' : 'div');
      if (!hasChildren) header.className = 'leaf';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = object.visible;

      // チェックボックスで表示・非表示を切り替え
      checkbox.addEventListener('change', () => {
          object.visible = checkbox.checked;
      });

      const name = document.createElement('span');
      name.textContent = `${object.name || '名前なし'} (${object.type})`;

      header.append(checkbox, name);
      item.appendChild(header);

      if (hasChildren) {
          // この階層は少し右にずらして表示
          const childContainer = document.createElement('div');
          childContainer.style.marginLeft = '1.5rem';
          for (const child of object.children) {
              createHierarhyUI(child, childContainer);
          }
          item.appendChild(childContainer);
      }

      container.appendChild(item);
    }
  })
};

// キャラクターのマテリアル
const characterMaterial = new THREE.MeshBasicMaterial({
  color:   new THREE.Color('rgb(220, 220, 220)'),
  opacity: 0.5,
  transparent: true,
});

// レイキャスト
const raycaster = new THREE.Raycaster();

// 下向きベクトル
const downDirection = new THREE.Vector3(0, -1, 0);

const addCharacterModel = (url: string) => {
  new GLTFLoader().load(url, function (gltf) {
    const model = gltf.scene;
    model.traverse((object: any) => {
      if (object.isMesh) {
        object.material.needUpdate = true;
        object.material = characterMaterial;
      }
    });
    // 大体人間の大きさに合わせる
    model.scale.set(0.9, 0.9, 0.9);

    model.position.set(0, 100, 0);

    // シーン内の床のオブジェクトを取得
    const ground = objs.FloorSurface;

    if (ground) {
      // レイキャストの設定
      raycaster.set(model.position, downDirection);
      const intersects = raycaster.intersectObject(ground, true);

      if (intersects.length > 0) {
        model.position.y = intersects[0].point.y;
      }
    }
  });
}

// オブジェクトを読み込み
const loadObjs = async () => {
  const initialPromises = [
    addStructureModel('models/MatumotoCivicArtsCenter_04.glb', 'FloorSurface'),
  ];

  // FloorSurface を読み込み
  await Promise.all(initialPromises);
  // モデルを読み込み
  addCharacterModel('models/Xbot.glb');
};

// 読み込み開始
loadObjs();

// ジョイスティックコントロールの設定
const joystick = new JoystickControl('joystick-ball');

// アニメーション
function animate() {
  const target = orbitControls.target;
  orbitControls.update();
  zoomControls.target.set(target.x, target.y, target.z);
  zoomControls.update();

  renderer.render(scene, camera);
};
animate();