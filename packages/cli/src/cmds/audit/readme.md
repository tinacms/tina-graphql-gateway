# Audit

Auditing is broken down into multiple steps

## Schema Validation

#### Handled by `yarn forstry schema:audit`

Schema validation is broken down further:

### JSON Schema validation

Fully static adherence to the JSON schema, this is the most basic level of validation.

### Dynamic validation

Ensuring that things like section `match` properties don't overlap.

Ensuring that `block->template_types` or `field_group->fields` keys are present

## Content

#### Handled by `yarn forstry content:audit`

Content is broken down further:

### Foreign key validation

Ensure references to other files are present

### Schema validation

Ensure the content matches the schema (ie. `title` is a `string`)

### Runtime validation

Ensure the content matches the config for a given field (ie. the `title` is at least 3 charactrs long)
