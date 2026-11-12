// DESIGN.md §12.4, §12.8: radii come from the --at-r-* scale by name (6 · 10 · 14 · 20 · 28 · 999), never as
// raw values. Allowed: 0, 50 %, the tokens and calc() over them (a nested corner may subtract --at-border).
// tokens.css defines the scale and is exempt.
const RADIUS_TOKENS = /^(?:0|50%|inherit|calc\(|var\(--at-r-[a-z0-9]+\)|var\(--at-border\)|[\s()+-])+$/u;
// DESIGN.md §12.8: the extension stylesheets take spacing, type and control heights by token only.
// Allowed: 0, auto, percentages, 1px borders, the tokens and calc() over them.
const SPACING_TOKENS =
  /^(?:0|auto|-?\d+%|calc\(|var\(--at-(?:s|gutter|section|card-pad|edge-min|dock-bottom|gap|h|border|icon)[a-z0-9-]*\)|[\s()*/+-]|\d+(?:\.\d+)?(?![\w%]))+$/u;
const TYPE_TOKENS = /^(?:inherit|var\(--at-type-[a-z0-9-]+\))$/u;
// DESIGN.md §11.2: every border and outline width is --at-border (1 px hairline) or --at-ring (2 px focus), never a
// raw length. Drawings made of borders opt out in marked lines.
const LINE_PROPS = '/^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|outline(-width)?)$/';
const LINE_TOKENS = /^(?![\s\S]*(?<![\w.-])\d*\.?\d+(?:px|rem|em)(?![\w-]))[\s\S]*$/u;
// docs/05 §1: the extension stylesheets take every colour from a var(--at-*) token. A mask reads alpha only, so it
// may name #000; drawings that keep fixed colours opt out in marked blocks.
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/iu;
const SHEETS = ['apps/extension/src/styles/base.css', 'apps/extension/entrypoints/*/*.css'];

export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-use-logical-spec', './scripts/stylelint-button-geometry.mjs'],
  rules: {
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['theme', 'custom-variant', 'slot', 'apply', 'utility', 'variant', 'source', 'plugin'] },
    ],
    'at-rule-prelude-no-invalid': [true, { ignoreAtRules: ['apply', 'custom-variant', 'theme'] }],
    'custom-property-empty-line-before': 'never',
    'import-notation': 'string',
    'liberty/use-logical-spec': [
      'always',
      {
        except: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'],
      },
    ],
    'declaration-property-value-allowed-list': [
      { '/^border(-[a-z]+)*-radius$/': [RADIUS_TOKENS], [LINE_PROPS]: [LINE_TOKENS] },
      {
        message: (prop, value) =>
          `${prop}: ${value} is not a token; use var(--at-r-*) for radii and var(--at-border) or var(--at-ring) for widths (DESIGN.md §11.2, §12.4)`,
      },
    ],
    'awaketab/button-geometry': true,
  },
  overrides: [
    { files: ['**/styles/tokens.css'], rules: { 'declaration-property-value-allowed-list': null } },
    {
      files: ['apps/extension/src/styles/base.css'],
      rules: { 'awaketab/button-geometry': null },
    },
    {
      files: SHEETS,
      rules: {
        'declaration-property-value-allowed-list': [
          {
            '/^border(-[a-z]+)*-radius$/': [RADIUS_TOKENS],
            [LINE_PROPS]: [LINE_TOKENS],
            '/^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)*$/': [SPACING_TOKENS],
            '/^(min-|max-)?(block|inline)-size$/': [
              /^(?!.*\d+(?:\.\d+)?(?:px|rem|em)\b).*$/u,
              /^(?:26px|6px|4px|36px)$/u,
            ],
            '/^font$/': [TYPE_TOKENS],
            '/^(font-size|line-height)$/': [/^$/u],
          },
          {
            message: (prop, value) => `${prop}: ${value} is not a token; use var(--at-*) (DESIGN.md §12)`,
          },
        ],
      },
    },
    {
      files: SHEETS,
      rules: {
        'color-named': 'never',
        'declaration-property-value-disallowed-list': [
          { '/^(?!(?:-webkit-)?mask(?:-image)?$|--[\\w-]*mask$)/': [RAW_COLOUR] },
          {
            message: (prop, value) => `${prop}: ${value} is a raw colour; use a var(--at-*) colour token (docs/05 §1)`,
          },
        ],
      },
    },
  ],
};
