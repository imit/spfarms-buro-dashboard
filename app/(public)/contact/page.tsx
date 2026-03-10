export default function ContactPage() {
  return (
    <div className="px-6 lg:px-10 py-16 lg:py-24 max-w-4xl mx-auto">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-8">Contact Us</h1>
      <div className="space-y-6 text-lg text-foreground/80">
        <p>
          Have questions about our products or interested in carrying SPFarms at your dispensary?
          We&apos;d love to hear from you.
        </p>
        <div className="space-y-2">
          <p>
            <span className="font-medium text-foreground">Email:</span>{" "}
            <a href="mailto:info@spfarmsny.com" className="text-primary hover:underline">
              info@spfarmsny.com
            </a>
          </p>
          <p>
            <span className="font-medium text-foreground">Instagram:</span>{" "}
            <a
              href="https://instagram.com/spfarmsny"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @spfarmsny
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
