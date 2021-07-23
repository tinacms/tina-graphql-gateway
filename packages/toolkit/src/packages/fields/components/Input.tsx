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

import styled, { css } from 'styled-components'

export interface InputProps {
  error?: boolean
  small?: boolean
  placeholder?: string
  step?: string | number
}

export const InputCss = css<InputProps>`
  box-sizing: border-box;
  padding: var(--tina-padding-small);
  border-radius: var(--tina-radius-small);
  background: var(--tina-color-grey-0);
  font-size: var(--tina-font-size-2);
  line-height: 1.35;
  position: relative;
  color: var(--tina-color-grey-10);
  background-color: var(--tina-color-grey-0);
  transition: all 85ms ease-out;
  border: 1px solid var(--tina-color-grey-2);
  width: 100%;
  margin: 0;
  outline: none;
  box-shadow: 0 0 0 2px
    ${(p) => (p.error ? 'var(--tina-color-error)' : 'transparent')};

  &:hover {
    box-shadow: 0 0 0 2px var(--tina-color-grey-3);
  }

  &:focus {
    box-shadow: 0 0 0 2px
      ${(p) =>
        p.error ? 'var(--tina-color-error)' : 'var(--tina-color-primary)'};
  }

  &::placeholder {
    font-size: var(--tina-font-size-2);
    color: var(--tina-color-grey-3);
  }

  ${(p) =>
    p.small &&
    css`
      font-size: var(--tina-font-size-1);
      padding: 8px var(--tina-padding-small);
    `};
`

export const Input = styled.input<InputProps>`
  ${InputCss}
`
