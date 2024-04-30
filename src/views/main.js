(function () {
  let colorType = ''; // RGB || Hex
  let selectedRgbColor = '';

  // State value
  let isActive = false;
  let timer;

  const vscode = acquireVsCodeApi();

  const colorsItemEl = document.querySelectorAll('.color-item');
  const selectedColorDiv = document.querySelector('.selected-color-text');
  const selector = document.querySelector('.dropdown-select');
  const refreshBtn = document.querySelector('.btn');

  selector.addEventListener('change', (event) => {
    const { value } = event.target;
    colorType = value;

    setColor(
      colorType === 'RGB'
        ? selectedRgbColor
        : `${getColorText(selectedRgbColor)})`
    );
  });

  colorsItemEl.forEach((el) => {
    el.addEventListener('dblclick', () => {
      const { color, start, end, file } = JSON.parse(
        decodeURIComponent(el.getAttribute('data-colorItem'))
      );
      selectedRgbColor = color;
      setColor(getColorText(color));

      vscode.postMessage({ command: 'gotoColor', file, start, end });
    });

    el.addEventListener('click', () => {
      const { color } = JSON.parse(
        decodeURIComponent(el.getAttribute('data-colorItem'))
      );
      selectedRgbColor = color;
      setColor(getColorText(color));
    });
  });

  // 刷新
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('btn--loading');
    vscode.postMessage({ command: 'refresh' });
  });

  // 色值复制
  selectedColorDiv.addEventListener('click', (el) => {
    const value = el.target.innerText;
    navigator.clipboard.writeText(value).then(() => {
      showAlert({ text: '已复制剪切板！' });
    });
  });

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'refreshEnd':
        // 根据 message.color 更新 Webview 的内容
        refreshBtn.classList.remove('btn--loading');

        break;
    }
  });

  const showAlert = ({ type = 'default', text }) => {
    // If there is an active toast already - do nothing
    if (isActive) {
      return;
    }

    // toast激活属性
    const modifiers = {
      active: 'toast--active'
    };

    // Start timer for hiding toast
    const startTimer = (el) => {
      timer = setTimeout(() => {
        // When toast hiding animation ends - remove it from DOM and toggle toasts state
        el.addEventListener('transitionend', () => {
          isActive = false;
          el.remove();
        });

        // Remove active class to start transition
        el.classList.remove(modifiers.active);
      }, 1500);
    };

    // Template for rendering toast from data
    const template = (item) =>
      `<div class="toast toast--${item.type}">
        ${item.text}
    </div>`;

    // Get toast html and add it to temporary element.
    // We do that to be able to use appendChild later
    const html = template({ type, text });
    const tempEl = document.createElement('div');

    tempEl.innerHTML = html;

    // Get the toast DOM element
    const toastEl = tempEl.firstChild;

    // Add event listeners to it. On hover - reset timer. On mouseout - start timer from 0.
    toastEl.addEventListener('mouseenter', () => clearTimeout(timer));
    toastEl.addEventListener('mouseleave', () => startTimer(toastEl));

    // Append toast element to body
    isActive = true;
    document.body.appendChild(toastEl);
    // Add an animation class on the next render tick, to make animation work
    setTimeout(() => toastEl.classList.add(modifiers.active), 0);
    // Start hiding timer
    startTimer(toastEl);
  };

  function setColor(color) {
    // 展示色值
    selectedColorDiv.innerHTML = `
    <div class="color-item-sm" style="background-color: ${color};"></div>
    <span>${color}</span>
    `;
  }

  function getColorText(rgbColor) {
    return colorType === 'RGB' ? rgbColor : rgbToHex(rgbColor);
  }

  function rgbToHex(rgb) {
    // 提取 RGB 数值
    const [r, g, b] = rgb.match(/\d+/g).map(Number);

    // 将一个颜色分量从十进制转换为十六进制
    function componentToHex(c) {
      var hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }

    // 将三个颜色分量转换为十六进制并拼接
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
})();
