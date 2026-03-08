import { useOnboardingStore } from '../../stores/useOnboardingStore';

export function StepWelcome() {
  const orgDescription = useOnboardingStore(s => s.orgDescription);
  const setOrgDescription = useOnboardingStore(s => s.setOrgDescription);
  const nextStep = useOnboardingStore(s => s.nextStep);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-primary">Velkommen til Cairn</h2>
        <p className="text-[12px] text-text-secondary mt-1">
          La oss bygge veikartet ditt. Start med å beskrive organisasjonen din,
          så hjelper vi deg med å sette opp kapabilitetskart og initiativer.
        </p>
      </div>

      <div>
        <label className="text-[10px] text-text-tertiary uppercase font-medium">
          Beskriv organisasjonen din
        </label>
        <textarea
          value={orgDescription}
          onChange={(e) => setOrgDescription(e.target.value)}
          placeholder="Vi er en frivillig organisasjon med 5000 medlemmer som jobber med..."
          rows={4}
          className="w-full mt-1 px-3 py-2 text-[12px] border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
        />
        <p className="text-[9px] text-text-tertiary mt-1">
          Denne beskrivelsen brukes til å tilpasse AI-forslag. Du kan hoppe over dette steget.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          className="px-4 py-2 text-[11px] font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Neste &rarr;
        </button>
      </div>
    </div>
  );
}
