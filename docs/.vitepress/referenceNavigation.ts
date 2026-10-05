
import type { DefaultTheme } from 'vitepress';

import type {
  NavigationJSON,
  NavigationItem as NavigationJSONItem
} from 'typedoc-plugin-markdown';


import navigationJSON from '../docs/reference/navigation.json' with { type: 'json' };


const navigationJSONItems: NavigationJSON = navigationJSON;

const sidebarItems = navigationJSONItems.map(convertItem);
  //.flatMap(item => item.children?.map(convertItem) ?? []);

export default sidebarItems;


function convertItem(
  inputItem: NavigationJSONItem
): DefaultTheme.SidebarItem {

  const link = inputItem.path ?? undefined;

  const items = inputItem.children?.map(convertItem);

  const isCollapsible = link !== undefined && items !== undefined;
  let collapsedValue = isCollapsible ? false : undefined;

  if (inputItem.title === 'Deprecated') {
    collapsedValue = true;
  }

  const deprecatedBadge = (inputItem.isDeprecated ? ' <span class="deprecated"></span>' : '');

  let outputItem: DefaultTheme.SidebarItem = {
    text: inputItem.title + deprecatedBadge,
    link: link,
    items: items,
    base: '/reference/',
    collapsed: collapsedValue
  };

  return outputItem;

}
