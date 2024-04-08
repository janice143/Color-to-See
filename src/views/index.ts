import { ColorItem } from '../colors-view-provider';

export const generateMainDiv = (colorList: ColorItem[] = []) =>
  `<div>
    <div class="color-grid">
    ${colorList.map((item) => singleColorDiv(item)).join('')}
    </div>
    <div class="selected-color-container">
      <div class="selected-color-header">
        <div class="selected-color-title">Selection Color</div>
          ${dropDownSelector()}
      </div>
        <div class="selected-color-text"></div>
    </div>
  </div>`;

const singleColorDiv = (item: ColorItem = {} as any) =>
  `<div  class="color-item" data-colorItem="${encodeURIComponent(
    JSON.stringify(item)
  )}" style="background-color: ${item.color};"></div>`;

const dropDownSelector = () => `
<div class="drop-down-selector-container">
  <div class="dropdown dropdown-dark">
    <select name="RGB" class="dropdown-select">
      <option value="RGB">RGB</option>
      <option value="Hex">Hex</option>
    </select>
  </div>
  </div>`;
