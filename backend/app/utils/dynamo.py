import boto3

class DynamoDBClient:
    def __init__(self, table_name):
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def put_item(self, item):
        self.table.put_item(Item=item)

    def get_item(self, key):
        response = self.table.get_item(Key=key)
        return response.get("Item", None)
