import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { Separator } from '@/components/atoms/separator';
import { Spinner } from '@/components/atoms/spinner';
import { IconAlertCircle } from '@tabler/icons-react';

type WIPPlaceholderProps = {
  title: string;
  content: string;
};

const WIPPlaceholder = (props: WIPPlaceholderProps) => {
  return <Card>
    <CardHeader>
      <CardTitle className="flex gap-2">
        <Spinner /> {props.title}
      </CardTitle>
    </CardHeader>

    <CardContent><p className="text-sm">{props.content}</p></CardContent>

    <Separator />
    <CardContent className="flex items-center gap-1">
      <IconAlertCircle className="size-4 text-red-500" />
      <span className="text-sm">This page is currently under construction.</span>
    </CardContent>
  </Card>;
};

export default WIPPlaceholder;
