/**
 * @fileoverview In-app guide outlining documentation workflow and troubleshooting tips
 */
import { FileText, Edit, Send, Clock, AlertTriangle } from 'lucide-react';

const FeatureCard = ({ icon, title, children }) => (
  <div className="bg-slate-50 rounded-lg p-6 flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 bg-[#003B44]/10 text-[#003B44] rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  </div>
);

/**
 * @component Guide
 * @description Contextual walkthrough describing application features and onboarding steps
 * @example
 *   <Guide onBack={() => setView('main')} />
 * @param {{onBack: () => void}} props
 * @returns {JSX.Element}
 */
export function Guide({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to the Task Journal!
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Your AI-powered assistant for generating technical documentation.
        </p>
      </div>

      <div className="space-y-8">
        <FeatureCard icon={<FileText size={20} />} title="Documentation Modes">
          <p>
            The application offers three specialized modes, accessible via tabs
            in the header:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Task Mode:</strong> Ideal for day-to-day engineering work.
              Paste a single dump with the problem, solution outline, key code,
              learnings, and outcomes.
            </li>
            <li>
              <strong>Architecture Mode:</strong> Best suited for systems and
              platforms. Use the same single field for overview, components,
              flows, decisions, and risks.
            </li>
            <li>
              <strong>Meeting Mode:</strong> Perfect for technical meetings.
              Paste meeting transcripts or notes (Portuguese/English mix
              accepted). The AI extracts decisions, action items, and technical
              context, translating everything to English.
            </li>
          </ul>
        </FeatureCard>

        <FeatureCard icon={<Edit size={20} />} title="The Input Form">
          <p>
            The form on the left is where you provide the inputs for the AI.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Notion Target:</strong> Select the Notion page where you
              want to send the final document. This list is populated with pages
              your Notion integration has access to.
            </li>
            <li>
              <strong>Single Field:</strong> All context lives in one textarea.
              Paste notes however you prefer — the AI handles the separation.
            </li>
            <li>
              <strong>Auto-Saving Drafts:</strong> Your progress in the form is
              automatically saved as a draft in your browser. If you refresh the
              page, your input will be restored.
            </li>
          </ul>
        </FeatureCard>

        <FeatureCard icon={<Send size={20} />} title="Generating & Sending">
          <p>Once you've filled out the form, you have several options:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Generate Documentation:</strong> Click this to have the AI
              create the technical documentation, which will appear in the
              right-hand panel.
            </li>
            <li>
              <strong>Edit:</strong> After generation, you can click 'Edit' to
              modify the markdown content directly.
            </li>
            <li>
              <strong>Copy All:</strong> Copies the entire generated markdown to
              your clipboard.
            </li>
            <li>
              <strong>Send to Notion:</strong> Sends the final documentation to
              your selected Notion page. The tool automatically handles large
              documents by splitting them into chunks to respect Notion's API
              limits.
            </li>
          </ul>
        </FeatureCard>

        <FeatureCard icon={<Clock size={20} />} title="History">
          <p>
            The application keeps a log of your 50 most recent generated
            documents.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Access your history by clicking the <strong>Clock icon</strong> in
              the header.
            </li>
            <li>
              Clicking an item from the history list will load its inputs and
              final documentation back into the app.
            </li>
            <li>
              Your history is stored locally in your browser and is not shared.
            </li>
          </ul>
        </FeatureCard>

        <FeatureCard
          icon={<AlertTriangle size={20} />}
          title="Common Questions"
        >
          <p>
            <strong>
              Why is the Notion Page dropdown empty or missing my page?
            </strong>
          </p>
          <p>
            This usually means your Notion integration hasn't been shared with
            the page. To fix this, go to your page in Notion, click "Share" in
            the top-right, click "Invite", and select your integration from the
            list.
          </p>
          <p>
            <strong>Why did I get an error when sending to Notion?</strong>
          </p>
          <p>
            Ensure your Notion API key and the selected Page ID are correct in
            your setup. Also, confirm the integration has "Insert content"
            permissions on the target page.
          </p>
        </FeatureCard>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#003B44] hover:bg-[#004850] focus-visible:ring-2 focus-visible:ring-[#003B44]/50 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        >
          Back to Generator
        </button>
      </div>
    </div>
  );
}
