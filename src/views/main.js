(function () {
  const vscode = acquireVsCodeApi();

  const colorsItemEl = document.querySelectorAll('.color-item');
  const selectedColorDiv = document.querySelector('.selected-color-text');

  colorsItemEl.forEach((el) => {
    el.addEventListener('click', () => {
      const { color, start, end, file } = JSON.parse(
        decodeURIComponent(el.getAttribute('data-colorItem'))
      );

      // 展示色值
      selectedColorDiv.textContent = `色值: ${color}`;

      vscode.postMessage({ command: 'gotoColor', file, start, end });
    });
  });
})();
