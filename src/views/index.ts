import { ColorItem, ColorMapping } from '../colors-view-provider';

export const generateMainDiv = (colorList: ColorItem[] = []) =>
  `<div>
  <div style="display: flex; flex-wrap: wrap; gap: 2px; padding: 10px">
  ${colorList.map((item) => singleColorDiv(item)).join('')}
  </div>
  <div class="selected-color-text" style="border: 1px solid black; padding: 10px"></div>
  </div>`;

const size = '20px';

const singleColorDiv = (item: ColorItem = {} as any) =>
  `<div  class="color-item" data-colorItem="${encodeURIComponent(
    JSON.stringify(item)
  )}" style="background-color: ${
    item.color
  }; width: ${size}; height: ${size}"></div>`;
