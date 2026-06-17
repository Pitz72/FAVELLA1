import AnimatedSection from "./AnimatedSection";
import { FEATURES } from "../constants";
import { iconByName } from "./icons";

const FeatureGrid = () => (
  <section className="max-w-7xl mx-auto">
    <AnimatedSection>
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="font-mono text-xs tracking-[0.2em] text-favella-cyan uppercase mb-3">Cosa sa fare</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-favella-text-primary">
          Un linguaggio che <span className="text-gradient-brand">pensa in italiano</span>
        </h2>
        <p className="text-favella-text-secondary mt-4 font-serif">
          Tutta la potenza di un motore per interactive fiction, nascosta dietro frasi che chiunque sa scrivere.
        </p>
      </div>
    </AnimatedSection>

    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {FEATURES.map((f, i) => {
        const Icon = iconByName[f.icon];
        return (
          <AnimatedSection key={f.title} delay={(i % 3) * 90}>
            <div className="group h-full glass rounded-2xl p-6 glow-border transition-all duration-300 hover:-translate-y-1.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-favella-cyan/10 text-favella-cyan group-hover:bg-brand-gradient group-hover:text-favella-dark transition-all duration-300">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-favella-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-favella-text-secondary leading-relaxed">{f.body}</p>
            </div>
          </AnimatedSection>
        );
      })}
    </div>
  </section>
);

export default FeatureGrid;
