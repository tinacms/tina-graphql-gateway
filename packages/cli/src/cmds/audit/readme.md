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

### Fixing

Multi-step process:

1. Remove empty values, the only exception here is `default`
2. Coerce types. If we get `3` and expect a string, we are able to coerce it to `"3"`
3. For some `default` fields which we aren't able to coerce, remove them. An example of this is our `select` field
   We populate the default value with `[]`. This is invalid and it doesn't have any meaning so we discard it. However if
   it was `[some-value]` we'd cast it to a string `some-value` and then evaluate that, if it's valid we'll keep it.
