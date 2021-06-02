//import { ToolbarWidgetPlugin } from '@tinacms/react-toolbar'
import { BranchSwitcher } from './BranchSwitcher'
/**
 * switch branches when using tina cloud
 * don't do it when using local client
 *
 */
export const _BranchSwitcherPlugin = {
  __type: 'toolbar:widget',
  name: 'branch-switcher',
  component: BranchSwitcher,
}

export class BranchSwitcherPlugin /*implements ToolbarWidgetPlugin*/ {
  public __type = 'toolbar:widget'
  public name = 'branch-switcher'

  constructor(public branches) {}

  public component = (props) => {
    return BranchSwitcher({
      ...props,
      branches: this.branches,
    })
  }
}
