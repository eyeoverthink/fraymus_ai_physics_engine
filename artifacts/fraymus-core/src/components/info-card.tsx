import { ArrowRight } from "lucide-react";

interface InfoCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  delay?: number;
  tags?: string[];
}

export function InfoCard({ title, description, icon: Icon, delay = 0, tags = [] }: InfoCardProps) {
  return (
    <div 
      className="group relative overflow-hidden rounded-sm border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      style={{ animationDelay: `${delay}ms`, animationDuration: '600ms' }}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-border transition-colors group-hover:bg-primary" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-secondary text-secondary-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
