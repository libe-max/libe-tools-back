import React, { Component } from 'react'
import Wrapper from './style'

/*
 *   Paragraph component
 *   ------------------------------------------------------
 *
 *   DESCRIPTION
 *   Component for usual text
 *
 *   VARIANTS
 *   small, light, italic, error
 *
 *   PROPS
 *   small, light, italic, error, children
 *
 */

export default class Paragraph extends Component {
  render () {
    const props = this.props
    let classes = 'paragraph'
    if (props.small) classes += ' paragraph_small'
    if (props.light) classes += ' paragraph_light'
    if (props.italic) classes += ' paragraph_italic'
    if (props.error) classes += ' paragraph_error'
    return <Wrapper className={classes}>
      {props.children}
    </Wrapper>
  }
}
