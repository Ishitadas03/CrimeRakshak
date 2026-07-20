"use client";

import { Card, CardContent } from "@/components/ui/card";
import * as motion from "motion/react-client";
import { UsersRound } from "lucide-react";

const teamMembers = [
  { name: "Soumyadip Mondal", role: "Full Stack Lead", initials: "SM", tags: ["AI/ML", "Backend", "System Design"], color: "from-brand-purple to-brand-blue" },
  { name: "Team Member 2", role: "Frontend Developer", initials: "T2", tags: ["React", "UI/UX", "TypeScript"], color: "from-brand-blue to-brand-cyan" },
  { name: "Team Member 3", role: "Data Scientist", initials: "T3", tags: ["ML Models", "Python", "Analytics"], color: "from-brand-cyan to-brand-teal" },
  { name: "Team Member 4", role: "Backend Engineer", initials: "T4", tags: ["Node.js", "Firebase", "APIs"], color: "from-brand-teal to-brand-green" },
  { name: "Team Member 5", role: "DevOps & Security", initials: "T5", tags: ["Cloud", "Docker", "Security"], color: "from-brand-violet to-brand-purple" },
];

export default function TeamPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <UsersRound className="h-7 w-7 text-brand-violet" /> Team INNOVATOR
        </h1>
        <p className="text-muted-foreground mt-1">The team behind CrimeRakshak AI 2.0</p>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card text-center py-8">
              <CardContent className="space-y-4">
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto text-white text-2xl font-heading font-bold shadow-lg`}>
                  {member.initials}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {member.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
