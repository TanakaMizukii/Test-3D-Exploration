import { KeyInputManager } from "./keyInputManager";

// ジョイスティックを管理するクラス
export class JoystickControl {
    private joystickBall   : HTMLElement;
    private joystickCenterX: number = 0;
    private joystickCenterY: number = 0;
    private joystickLimit  : number;
    private touchX         : number = 0;  // タッチ入力のX値
    private touchY         : number = 0;  // タッチ入力のY値

    // keyManager変数には、KeyInputManagerクラスから作られたインスタンスを格納する」という意味
    private keyManager: KeyInputManager;

    constructor(joystickId: string, joystickLimit: number = 35) {
        const element = document.getElementById(joystickId);
        if (!element) throw new Error(`Joystick element with ID "${joystickId}" not found.`);

        this.joystickBall  = element;
        this.joystickLimit = joystickLimit;

        // キー入力マネージャーの初期化
        this.keyManager = new KeyInputManager();

        this.init();
    }

    // 初期化
    private init(): void {
        this.updateJoystickCenter();
        this.addEventListeners();
        window.addEventListener('resize', () => this.updateJoystickCenter());
    }

    // ジョイステックの中心位置を更新
    private updateJoystickCenter(): void {
        // getBoundingClientRect()はブラウザの表示領域の左上を (0, 0) として
        // 要素の位置と大きさをピクセル単位で取得するメソッド(left, top, right, bottom, width, heightが選択利用可能)
        const rect = this.joystickBall.getBoundingClientRect();
        this.joystickCenterX = (rect.left + rect.right) / 2;
        this.joystickCenterY = (rect.top + rect.bottom) / 2;
    }

    // イベントリスナーを登録
    private addEventListeners(): void {
        // タッチ移動時
        this.joystickBall.addEventListener(
            'touchmove', (event) => this.dragMove(event)
        );

        // タッチ解除時
        this.joystickBall.addEventListener(
            'touchend', () => this.dragLeave()
        );
    }

    // タッチ移動処理
    private dragMove(event: TouchEvent): void {
        event.preventDefault();

        const pageX = event.touches[0].pageX;
        const pageY = event.touches[0].pageY;

        this.touchX = Math.min(Math.max(pageX - this.joystickCenterX, -this.joystickLimit), this.joystickLimit)
        this.touchY = Math.min(Math.max(pageY - this.joystickCenterY, -this.joystickLimit), this.joystickLimit)

        this.updateJoystickBall();
    }

    // タッチリリース処理
    private dragLeave(): void {
        this.touchX = 0;
        this.touchY = 0;
        this.updateJoystickBall();
    }

    // ジョイスティックの位置を更新
    private updateJoystickBall(): void {
        // X方向の判定
        let keyX: number = 0;
        if (this.keyManager.isKeyPressed('a')) {
            // Aキーが押されていたら左へ
            keyX = -this.joystickLimit;
        } else if (this.keyManager.isKeyPressed('d')) {
            // Dキーが押されていたら右へ
            keyX = this.joystickLimit;
        }

        // Y方向の判定
        let keyY: number = 0;
        if (this.keyManager.isKeyPressed('w')) {
            // Wキーが押されていたら上へ
            keyY = this.joystickLimit;
        } else if (this.keyManager.isKeyPressed('s')) {
            // Sキーが押されていたら下へ
            keyY = -this.joystickLimit;
        }

        // タッチとキー入力を合算
        let totalX = this.touchX + keyX;
        let totalY = this.touchY + keyY;

        // 円の範囲内に制限
        const distance = Math.hypot(totalX, totalY);
        if (distance > this.joystickLimit) {
            const angle = Math.atan2(totalY, totalX);
            totalX = Math.cos(angle) * this.joystickLimit;
            totalY = Math.sin(angle) * this.joystickLimit;
        }

        this.joystickBall.style.translate = `${totalX}px ${totalY}px`
    }

    // ジョイスティックの方向を取得
    public getDirection(): { x: number; y: number } {
        // X方向の判定
        let keyX: number = 0;
        if (this.keyManager.isKeyPressed('a')) {
            // Aキーが押されていたら左へ
            keyX = -this.joystickLimit;
        } else if (this.keyManager.isKeyPressed('d')) {
            // Dキーが押されていたら右へ
            keyX = this.joystickLimit;
        }

        // Y方向の判定
        let keyY: number = 0;
        if (this.keyManager.isKeyPressed('w')) {
            // Wキーが押されていたら上へ
            keyY = -this.joystickLimit;
        } else if (this.keyManager.isKeyPressed('s')) {
            // Sキーが押されていたら下へ
            keyY = this.joystickLimit;
        }

        // タッチとキー入力を合算
        let totalX = this.touchX + keyX;
        let totalY = this.touchY + keyY;

        const magnitude = Math.hypot(totalX, totalY);
        if (magnitude === 0) {
            return {x: 0, y: 0}; // ジョイスティックが動いていない
        }

        return {
            x: totalX / this.joystickLimit,  // Xの正規化(-1~1)
            y: -totalY / this.joystickLimit, // Yの反転で上が正
        }
    }
}