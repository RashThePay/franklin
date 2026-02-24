import type { Crew, Officer } from './types';

export function processSurvival(
  officers: Officer[],
  milesMoved: number,
  logisticsHealthChange: number,
  logisticsMoraleChange: number
): Officer[] {
  const newOfficers = officers.map((officer) => {
    const processPerson = (person: Crew, isOfficer: boolean, officerMorale: number): Crew => {
      let { health, morale, isIll, isDepressed, belief } = person;

      // Base health/morale changes from logistics
      health += logisticsHealthChange;
      morale += logisticsMoraleChange;

      // Rest impact
      if (person.isResting) {
        health += 0.5;
        morale += 0.5;
      }

      // Disease impact
      if (isIll) {
        health -= Math.random(); // 0 to 1
      }

      // Depression impact
      // (Handled at ship level for all-crew reduction)

      // Officer morale impact on crew
      if (!isOfficer) {
        if (officerMorale > 7) morale += 0.2;
        if (officerMorale < 4) morale -= 0.2;
      }

      // Belief impact from movement
      if (milesMoved > 0) { // North
        if (belief === 'OPTIMISTIC') morale += 0.1 * milesMoved;
        if (belief === 'PESSIMISTIC') morale -= 0.1 * milesMoved;
      } else if (milesMoved < 0) { // South
        if (belief === 'OPTIMISTIC') morale -= 0.1 * Math.abs(milesMoved);
        if (belief === 'PESSIMISTIC') morale += 0.1 * Math.abs(milesMoved);
      }

      // Illness/Depression state changes
      if (health < 5 && !isIll) isIll = true;

      if (morale < 5 && !isDepressed) isDepressed = true;

      // Belief degradation
      if (isIll || isDepressed) {
          if (belief === 'OPTIMISTIC') belief = 'DOUBTING';
          else if (belief === 'DOUBTING') belief = 'PESSIMISTIC';
      }

      // Bounds
      health = Math.max(0, Math.min(10, health));
      morale = Math.max(0, Math.min(10, morale));

      return { ...person, health, morale, isIll, isDepressed, belief };
    };

    const updatedOfficer = processPerson(officer, true, officer.morale) as Officer;
    updatedOfficer.crew = officer.crew.map((c) => processPerson(c, false, updatedOfficer.morale));

    return updatedOfficer;
  });

  return newOfficers;
}

export function spreadDisease(officers: Officer[]): Officer[] {
    return officers.map(officer => {
        const cabin = [officer, ...officer.crew];
        const illCount = cabin.filter(p => p.isIll).length;

        const updatedCabin = cabin.map(person => {
            if (!person.isIll && illCount > 0) {
                // 10% chance per ill person
                for (let i = 0; i < illCount; i++) {
                    if (Math.random() < 0.10) {
                        return { ...person, isIll: true, health: 4 };
                    }
                }
            }
            return person;
        });

        const [newOfficer, ...newCrew] = updatedCabin;
        return { ...newOfficer, crew: newCrew } as Officer;
    });
}

export function applyDoctor(officers: Officer[]): Officer[] {
    // Ship doctor treats up to 3 ill people with lowest health
    let allIll: { person: Crew; officerId: string; isOfficer: boolean }[] = [];

    officers.forEach(o => {
        if (o.isIll) allIll.push({ person: o, officerId: o.id, isOfficer: true });
        o.crew.forEach(c => {
            if (c.isIll) allIll.push({ person: c, officerId: o.id, isOfficer: false });
        });
    });

    allIll.sort((a, b) => a.person.health - b.person.health);
    const targets = allIll.slice(0, 3);

    return officers.map(o => {
        const update = (p: Crew) => {
            const target = targets.find(t => t.person.id === p.id);
            if (target) {
                const boost = 0.5 + Math.random() * 2; // 0.5 to 2.5
                return { ...p, health: Math.min(10, p.health + boost) };
            }
            return p;
        };

        const newOfficer = update(o) as Officer;
        newOfficer.crew = o.crew.map(update);
        return newOfficer;
    });
}

export function simulateWalkDay(
    people: { id: string; health: number; morale: number; isIll: boolean; provisions: number }[]
) {
    return people.map(p => {
        let { health, morale, provisions, isIll } = p;

        // Move and consume
        if (provisions > 0) {
            provisions -= 1;
        } else {
            health -= 0.4;
            morale -= 0.4;
        }

        // Decay
        health -= isIll ? 0.2 : 0.1;
        if (isIll) morale -= 0.2;

        // Bounds
        health = Math.max(0, health);
        morale = Math.max(0, morale);

        return { ...p, health, morale, provisions };
    });
}
