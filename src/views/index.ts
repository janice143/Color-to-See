import { ColorItem } from '../types';

export const generateMainDiv = (colorList: ColorItem[] = []) =>
  alertWrapper(
    `<div>
  ${refreshBtn()}
  <div class="color-grid">
  ${
    !colorList.length
      ? emptyContent()
      : colorList.map((item) => singleColorDiv(item)).join('')
  }
  </div>
  <div class="selected-color-container">
    <div class="selected-color-header">
      <div class="selected-color-title">Selection Color</div>
        ${dropDownSelector()}
    </div>
      <div class="selected-color-text"></div>
  </div>
</div>`
  );

const singleColorDiv = (item: ColorItem = {} as any) =>
  `<div  class="color-item" data-colorItem="${encodeURIComponent(
    JSON.stringify(item)
  )}" style="background-color: ${item.color};"></div>`;

const dropDownSelector = () => `
<div class="drop-down-selector-container">
  <div class="dropdown dropdown-dark">
    <select class="dropdown-select">
      <option value="RGB">RGB</option>
      <option value="Hex" selected>Hex</option>
    </select>
  </div>
  </div>`;

const refreshBtn = () => `
<div class="refresh-btn-container">
  <a class="btn">
      点击刷新
      <span>
          <b></b>
          <b></b>
          <b></b>
      </span>
  </a>
</div>
`;

const alertWrapper = (div) => `
<div class="container">
${div}
</div>
`;

const emptyContent = () => {
  return `<div class="empty-content">
  <span>￣_(ツ)_/￣</span>
  <span class="text">没有找到颜色~</span>
  </div>`;
};
