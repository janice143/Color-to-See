(function () {
  let colorType = 'RGB'; // RGB || Hex
  let selectedRgbColor = '';

  const vscode = acquireVsCodeApi();

  const colorsItemEl = document.querySelectorAll('.color-item');
  const selectedColorDiv = document.querySelector('.selected-color-text');
  const selector = document.querySelector('.dropdown-select');

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
      setColor(getColorText(color));
    });
  });

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
