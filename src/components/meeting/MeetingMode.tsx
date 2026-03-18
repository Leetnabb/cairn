import { useStore } from '../../stores/useStore';
import { NarrativeOpening } from './NarrativeOpening';
import { LensPath } from './LensPath';
import { LensCapabilities } from './LensCapabilities';
import { LensEffects } from './LensEffects';
import { MeetingNav } from './MeetingNav';

export default function MeetingMode() {
  const meetingLens = useStore(s => s.ui.meetingLens);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] overflow-auto">
      {meetingLens === 'narrative' && <NarrativeOpening />}
      {meetingLens === 'path' && <LensPath />}
      {meetingLens === 'capabilities' && <LensCapabilities />}
      {meetingLens === 'effects' && <LensEffects />}
      <MeetingNav />
    </div>
  );
}
