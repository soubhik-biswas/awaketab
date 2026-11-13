'use client';

import {
  Accent,
  Backdrop,
  cardOf,
  dial,
  Domain,
  Eyebrow,
  FaceAt,
  Headline,
  Logo,
  Text,
  VIOLET_FILL,
  VIOLET_INK,
} from './kit';

export function Soc01() {
  return (
    <>
      <Backdrop tone="dark" />
      <Logo tone="dark" center y={117} size={44} />
      <Eyebrow center y={181} size={22} track=".2em">
        Launching today
      </Eyebrow>
      <Headline center y={258} size={92}>
        Keep this screen <Accent>awake.</Accent>
      </Headline>
      <FaceAt face="ring" theme="dark" cx={540} cy={667} size={dial(394)} />
      <Text
        center
        y={997}
        className="font-mono"
        style={{ fontSize: 20, letterSpacing: '.2em', paddingLeft: '.2em', color: 'var(--a-mute)' }}
      >
        FREE · NO INSTALL · awaketab.com
      </Text>
    </>
  );
}

export function Soc02() {
  return (
    <>
      <Backdrop tone="dark" />
      <Logo tone="dark" center y={244} size={55} />
      <Eyebrow center y={323} size={28} track=".2em">
        One click · free
      </Eyebrow>
      <Headline center y={405} size={110}>
        Keep this
      </Headline>
      <Headline center y={511} size={110}>
        screen <Accent>awake.</Accent>
      </Headline>
      <FaceAt face="aurora" theme="dark" cx={540} cy={1036} size={cardOf(590)} />
      <div
        className="font-sans"
        style={{
          position: 'absolute',
          left: 424,
          top: 1526,
          width: 232,
          height: 83,
          borderRadius: 999,
          background: VIOLET_FILL,
          boxShadow: '0 18px 44px -12px rgba(154,119,255,.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 700,
          color: VIOLET_INK,
        }}
      >
        Try it free
      </div>
      <Text center y={1644} style={{ letterSpacing: '.2em', paddingLeft: '.2em', color: 'var(--a-mute)' }}>
        <Domain size={22} />
      </Text>
    </>
  );
}

export function PromoSmall() {
  return (
    <>
      <Backdrop tone="dark" />
      <Logo tone="dark" x={31} y={47} size={24} />
      <Headline x={31} y={95} size={34}>
        Keep this
      </Headline>
      <Headline x={31} y={133} size={34}>
        screen <Accent>awake.</Accent>
      </Headline>
      <Text
        x={31}
        y={175}
        className="font-mono"
        style={{ fontSize: 12, fontWeight: 500, letterSpacing: '.18em', color: 'var(--a-mute)' }}
      >
        FREE · ONE CLICK
      </Text>
      <FaceAt face="ring" theme="dark" cx={358} cy={140} size={dial(190)} />
    </>
  );
}

export function PromoMarquee() {
  return (
    <>
      <Backdrop tone="dark" />
      <Logo tone="dark" x={98} y={139} size={30} />
      <Headline x={97} y={226} size={72}>
        Keep this screen
      </Headline>
      <Headline x={97} y={312} size={72}>
        <Accent>awake.</Accent>
      </Headline>
      {[
        'One click and your screen stays on — for a recipe, a',
        'slide deck or a dashboard. 46 clock faces, all free.',
      ].map((l, i) => (
        <Text key={l} x={97} y={388 + i * 33} className="font-sans" style={{ fontSize: 20, color: 'var(--a-mute)' }}>
          {l}
        </Text>
      ))}
      <FaceAt face="ring" theme="dark" cx={1070} cy={240} size={dial(376)} />
    </>
  );
}
