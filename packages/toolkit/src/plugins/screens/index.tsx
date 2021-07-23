/**

Copyright 2021 Forestry.io Holdings, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import * as React from 'react'
import { SettingsIcon } from '../../packages/icons'
import { Form } from '../../packages/forms'
import { ScreenPlugin } from '../../packages/react-screens'
import { FormBuilder } from '../../packages/form-builder'

export class GlobalFormPlugin implements ScreenPlugin {
  __type: ScreenPlugin['__type'] = 'screen'
  name: ScreenPlugin['name']
  Component: ScreenPlugin['Component']
  Icon: ScreenPlugin['Icon']
  layout: ScreenPlugin['layout']

  constructor(
    public form: Form,
    icon?: ScreenPlugin['Icon'],
    layout?: ScreenPlugin['layout']
  ) {
    this.name = form.label
    this.Icon = icon || SettingsIcon
    this.layout = layout || 'popup'
    this.Component = () => {
      return <FormBuilder form={form as any} />
    }
  }
}
