import { SiteFace } from './site-face';

export interface IFaceCard {
  id: string;
  name: string;
  desc: string;
}

// The faces gallery: each face running at 38 minutes left of an hour, 150 px on phones and 300 px from tablets,
// two to a row until tablet landscape, then three.
export function FacesGallery({ items }: { items: readonly IFaceCard[] }) {
  return (
    <ul role="list" className="m-0 grid list-none grid-cols-2 gap-3 p-0 min-[700px]:gap-5 min-[1100px]:grid-cols-3">
      {items.map((f) => (
        <li key={f.id} className="flex flex-col gap-3">
          <span className="flex justify-center">
            <span className="relative block size-[150px] min-[700px]:size-[300px]">
              <SiteFace
                face={f.id}
                size={300}
                phoneSize={150}
                state="running"
                total={3600}
                remain={2292}
                bare
                framed
                className="relative block"
              />
            </span>
          </span>
          <span className="flex flex-col gap-1">
            <strong className="text-[17px]">{f.name}</strong>
            <span className="text-[14px] leading-normal text-muted-foreground-strong">{f.desc}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
